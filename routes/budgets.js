const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');

// GET /api/budgets?month=YYYY-MM
router.get('/', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const query = { user: req.userId };
    if (month) query.month = month;
    const budgets = await Budget.find(query);
    res.json({ budgets });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/budgets  — upsert budget for category+month
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    if (!category || !limit || !month)
      return res.status(400).json({ error: 'category, limit, month required' });

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category, month },
      { limit: parseFloat(limit) },
      { upsert: true, new: true }
    );
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
