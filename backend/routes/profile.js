const express = require('express');
const router = express.Router();

// Profile endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Profile endpoint - Coming soon' });
});

module.exports = router;
