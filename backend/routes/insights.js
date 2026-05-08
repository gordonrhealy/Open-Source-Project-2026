const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const authRequired = require('../middleware_auth');

router.use(authRequired);

function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthEnd(date = new Date()) {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function normalizeMerchant(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function median(numbers) {
  const sorted = numbers.filter(n => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function detectRecurring(transactions) {
  const groups = new Map();
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const key = `${normalizeMerchant(t.description)}|${t.category}|${t.paymentMethod || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    });

  return [...groups.values()]
    .filter(group => group.length >= 2)
    .map(group => {
      const sorted = [...group].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const amounts = sorted.map(t => Number(t.amount || 0));
      const last = sorted[sorted.length - 1];
      const dates = sorted.map(t => new Date(t.date));
      const gaps = dates.slice(1).map((d, index) => Math.round((d - dates[index]) / 86400000)).filter(Boolean);
      const gap = Math.round(median(gaps)) || 30;
      const frequency = gap <= 8 ? 'weekly' : gap <= 16 ? 'biweekly' : gap <= 45 ? 'monthly' : gap <= 100 ? 'quarterly' : 'yearly';
      return {
        description: last.description,
        category: last.category,
        amount: Number(median(amounts).toFixed(2)),
        paymentMethod: last.paymentMethod,
        occurrences: sorted.length,
        frequency,
        nextExpectedDate: addDays(new Date(last.date), gap),
        confidence: Math.min(0.96, 0.45 + sorted.length * 0.13)
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

function detectAnomalies(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const byCategory = new Map();
  expenses.forEach(t => {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category).push(Number(t.amount || 0));
  });

  return expenses
    .map(t => {
      const values = byCategory.get(t.category) || [];
      const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
      const score = avg > 0 ? Number((Number(t.amount || 0) / avg).toFixed(2)) : 0;
      return { transaction: t, categoryAverage: Number(avg.toFixed(2)), score };
    })
    .filter(item => item.score >= 1.8 && Number(item.transaction.amount) >= 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => ({
      id: item.transaction._id,
      date: item.transaction.date,
      description: item.transaction.description,
      category: item.transaction.category,
      amount: item.transaction.amount,
      categoryAverage: item.categoryAverage,
      score: item.score,
      reason: `${item.score}x higher than your usual ${item.transaction.category} expense`
    }));
}

function categoryTrends(transactions) {
  const currentStart = monthStart();
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);
  const previousStart = monthStart(previousDate);
  const previousEnd = monthEnd(previousDate);
  const map = new Map();

  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!map.has(t.category)) map.set(t.category, { category: t.category, current: 0, previous: 0 });
    const row = map.get(t.category);
    if (t.date >= currentStart) row.current += Number(t.amount || 0);
    if (t.date >= previousStart && t.date <= previousEnd) row.previous += Number(t.amount || 0);
  });

  return [...map.values()].map(row => ({
    ...row,
    current: Number(row.current.toFixed(2)),
    previous: Number(row.previous.toFixed(2)),
    changePercent: row.previous > 0 ? Math.round(((row.current - row.previous) / row.previous) * 100) : row.current > 0 ? 100 : 0
  })).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);
}

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const ninetyDaysAgo = addDays(now, -90);
    const currentStart = monthStart(now);
    const currentEnd = monthEnd(now);

    const [transactions, budgets] = await Promise.all([
      Transaction.find({ user: req.user._id, isDeleted: false, date: { $gte: ninetyDaysAgo } }).sort({ date: -1 }).limit(1000).lean(),
      Budget.find({ user: req.user._id, isActive: true }).lean()
    ]);

    const currentMonth = transactions.filter(t => t.date >= currentStart && t.date <= currentEnd);
    const income = currentMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expenses = currentMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const dailyAverageExpense = expenses / Math.max(now.getDate(), 1);
    const forecastExpense = Number((dailyAverageExpense * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).toFixed(2));
    const projectedSavings = Number((income - forecastExpense).toFixed(2));

    const budgetAlerts = budgets.map(budget => {
      const spent = currentMonth
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const percentageUsed = budget.amount > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0;
      return {
        id: budget._id,
        category: budget.category,
        amount: budget.amount,
        spent: Number(spent.toFixed(2)),
        remaining: Number((Number(budget.amount) - spent).toFixed(2)),
        percentageUsed,
        status: percentageUsed >= 100 ? 'over' : percentageUsed >= 80 ? 'warning' : 'healthy'
      };
    }).filter(item => item.percentageUsed >= 70).sort((a, b) => b.percentageUsed - a.percentageUsed);

    const recurring = detectRecurring(transactions);
    const anomalies = detectAnomalies(transactions);
    const trends = categoryTrends(transactions);
    const topExpense = [...currentMonth].filter(t => t.type === 'expense').sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    const insights = [];
    if (projectedSavings < 0) insights.push({ title: 'Projected overspend', detail: `At the current pace, this month may finish ${Math.abs(projectedSavings).toFixed(2)} below income.`, tone: 'red' });
    if (budgetAlerts[0]) insights.push({ title: 'Budget pressure', detail: `${budgetAlerts[0].category} is already ${budgetAlerts[0].percentageUsed}% used.`, tone: budgetAlerts[0].status === 'over' ? 'red' : 'yellow' });
    if (recurring[0]) insights.push({ title: 'Recurring payment detected', detail: `${recurring[0].description} looks ${recurring[0].frequency}; next expected around ${recurring[0].nextExpectedDate}.`, tone: 'blue' });
    if (anomalies[0]) insights.push({ title: 'Unusual expense', detail: `${anomalies[0].description} is ${anomalies[0].reason}.`, tone: 'red' });
    if (topExpense) insights.push({ title: 'Largest current expense', detail: `${topExpense.description} is the biggest expense this month.`, tone: 'blue' });

    res.json({
      forecast: {
        income: Number(income.toFixed(2)),
        expenses: Number(expenses.toFixed(2)),
        forecastExpense,
        projectedSavings,
        dailyAverageExpense: Number(dailyAverageExpense.toFixed(2))
      },
      recurring,
      anomalies,
      budgetAlerts,
      trends,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate smart insights' });
  }
});

module.exports = router;
