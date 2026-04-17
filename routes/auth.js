const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ error: 'Username already taken' });

    const user = await User.create({ username, password, email: email || '' });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, currency: user.currency }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid username or password' });

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, username: user.username, currency: user.currency }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me  (verify token & return user)
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/settings
router.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const { currency, email } = req.body;
    const update = {};
    if (currency) update.currency = currency;
    if (email !== undefined) update.email = email;
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
