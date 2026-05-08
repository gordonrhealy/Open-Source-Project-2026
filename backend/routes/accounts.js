const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const authRequired = require('../middleware_auth');

const getMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  };
};

router.use(authRequired);

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = getMonthRange();

    const monthly = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          isDeleted: false,
          type: { $in: ['income', 'expense'] },
          date: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const allTime = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          isDeleted: false,
          type: { $in: ['income', 'expense'] }
        }
      },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const categories = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          isDeleted: false,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const readTotal = (arr, type) => arr.find(item => item._id === type)?.total || 0;
    const income = readTotal(monthly, 'income');
    const expenses = readTotal(monthly, 'expense');
    const allIncome = readTotal(allTime, 'income');
    const allExpenses = readTotal(allTime, 'expense');

    res.json({
      totalBalance: allIncome - allExpenses,
      income,
      expenses,
      savings: income - expenses,
      netCashflow: income - expenses,
      categoryBreakdown: categories.map(item => ({
        category: item._id,
        total: item.total,
        count: item.count
      })),
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/', async (req, res) => {
  try {
    const account = await Account.create({
      user: req.user._id,
      name: req.body.name || 'Cash Wallet',
      type: req.body.type || 'cash',
      currency: req.body.currency || 'EUR',
      initialBalance: Number(req.body.initialBalance || 0),
      balance: {
        current: Number(req.body.initialBalance || 0),
        available: Number(req.body.initialBalance || 0),
        pending: 0
      }
    });
    res.status(201).json({ account });
  } catch (error) {
    console.error('Account create error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

module.exports = router;
