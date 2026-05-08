const express = require('express');
const router = express.Router();

// Notification endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint - Coming soon' });
});

module.exports = router;
