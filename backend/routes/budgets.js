const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const authRequired = require('../middleware_auth');

router.use(authRequired);

function monthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  };
}

async function attachProgress(budget, userId) {
  const spentResult = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        category: budget.category,
        isDeleted: false,
        date: { $gte: budget.startDate, $lte: budget.endDate }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const spent = spentResult[0]?.total || 0;
  const obj = budget.toObject ? budget.toObject() : budget;
  obj.spent = spent;
  obj.remaining = Number(obj.amount || 0) - spent;
  obj.percentageUsed = Number(obj.amount || 0) > 0 ? Math.round((spent / Number(obj.amount)) * 100) : 0;
  return obj;
}

router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    const withProgress = await Promise.all(budgets.map(b => attachProgress(b, req.user._id)));
    res.json({ budgets: withProgress });
  } catch (error) {
    console.error('Fetch budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.body.startDate && req.body.endDate ? req.body : monthRange();
    const budget = await Budget.create({
      user: req.user._id,
      name: req.body.name || `${req.body.category} Budget`,
      category: req.body.category,
      amount: Number(req.body.amount),
      currency: req.body.currency || 'EUR',
      period: req.body.period || 'monthly',
      startDate,
      endDate,
      color: req.body.color || '#2563eb',
      icon: req.body.icon || '💳'
    });

    res.status(201).json({ budget: await attachProgress(budget, req.user._id) });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: error.message || 'Failed to create budget' });
  }
});

module.exports = router;
