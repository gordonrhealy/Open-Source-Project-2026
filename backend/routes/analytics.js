const express = require('express');
const router = express.Router();

// Analytics endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint - Coming soon' });
});

module.exports = router;
