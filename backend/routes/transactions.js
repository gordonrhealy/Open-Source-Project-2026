const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const authRequired = require('../middleware_auth');

router.use(authRequired);

const EXPENSE_CATEGORIES = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Rent', 'Health', 'Education', 'Entertainment', 'Travel', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Business', 'Freelance', 'Gift', 'Investment', 'Other Income'];

async function getDefaultAccount(userId) {
  let account = await Account.findOne({ user: userId, name: 'Cash Wallet' });
  if (!account) {
    account = await Account.create({
      user: userId,
      name: 'Cash Wallet',
      type: 'cash',
      currency: 'EUR',
      initialBalance: 0,
      balance: { current: 0, available: 0, pending: 0 }
    });
  }
  return account;
}

router.get('/categories', (req, res) => {
  res.json({ expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES });
});

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || now.getMonth() + 1);
    const summary = await Transaction.getMonthlySummary(req.user._id, year, month);
    const categoryBreakdown = await Transaction.getSpendingByCategory(
      req.user._id,
      `${year}-${String(month).padStart(2, '0')}-01`,
      `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`
    );
    res.json({ summary, categoryBreakdown });
  } catch (error) {
    console.error('Transaction summary error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
});

router.get('/', async (req, res) => {
  try {
    const query = { user: req.user._id, isDeleted: false };

    if (req.query.type && ['income', 'expense', 'transfer'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(req.query.limit || 100));

    res.json({ transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date, notes, paymentMethod } = req.body;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Transaction type must be income or expense' });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    if (!category || !description || !date) {
      return res.status(400).json({ error: 'Category, description and date are required' });
    }

    const account = req.body.account
      ? await Account.findOne({ _id: req.body.account, user: req.user._id })
      : await getDefaultAccount(req.user._id);

    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      account: account._id,
      type,
      amount: numericAmount,
      currency: req.body.currency || 'EUR',
      category,
      description,
      notes: notes || '',
      date,
      time: req.body.time || '12:00',
      paymentMethod: paymentMethod || 'card',
      importSource: 'manual'
    });

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to create transaction' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDeleted: true },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted', transaction });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
