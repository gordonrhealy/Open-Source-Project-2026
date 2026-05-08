const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', async (req, res) => {
  try {
    const goal = await Goal.create(req.body);
    res.status(201).json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

module.exports = router;
