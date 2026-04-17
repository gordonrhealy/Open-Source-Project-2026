const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/transactions  — list with filters
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, from, to, search, sort = '-date', page = 1, limit = 500 } = req.query;
    const query = { user: req.userId };

    if (type) query.type = type;
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Transaction.countDocuments(query);
    const txns  = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions: txns, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transactions
router.post('/', auth, async (req, res) => {
  try {
    const { type, name, amount, category, date, note, recurring, tags } = req.body;

    if (!type || !name || !amount || !date)
      return res.status(400).json({ error: 'type, name, amount, and date are required' });

    const txn = await Transaction.create({
      user: req.userId, type, name,
      amount: parseFloat(amount), category: category || 'Other',
      date, note: note || '', recurring: !!recurring, tags: tags || []
    });

    res.status(201).json({ transaction: txn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const txn = await Transaction.findOne({ _id: req.params.id, user: req.userId });
    if (!txn) return res.status(404).json({ error: 'Not found' });

    const allowed = ['name', 'amount', 'category', 'date', 'note', 'type', 'recurring', 'tags'];
    allowed.forEach(k => { if (req.body[k] !== undefined) txn[k] = req.body[k]; });
    await txn.save();

    res.json({ transaction: txn });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const txn = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!txn) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transactions  — delete ALL for user
router.delete('/', auth, async (req, res) => {
  try {
    await Transaction.deleteMany({ user: req.userId });
    res.json({ message: 'All transactions deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/transactions/summary  — aggregated stats
router.get('/summary', auth, async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2026-04"
    const query = { user: req.userId };
    if (month) query.date = { $regex: `^${month}` };

    const result = await Transaction.aggregate([
      { $match: { ...query, user: require('mongoose').Types.ObjectId.createFromHexString(req.userId) } },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ summary: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
