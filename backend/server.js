// Finova Backend Server - Super Simplified Version
// Munster Technological University, Ireland
// Developers: Mofazzal Hossain & Gordan Healy

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve production frontend build when it exists.
// This is used by the Windows EXE build, where the React app is bundled into backend/public.
const publicPath = path.join(__dirname, 'public');
const frontendIndex = path.join(publicPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndex);

if (hasFrontendBuild) {
  app.use(express.static(publicPath));
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finova', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║        FINOVA BACKEND - SIMPLIFIED VERSION            ║');
    console.log('║     Munster Technological University, Ireland         ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    console.log('✅ MongoDB Connected Successfully!\n');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('\n⚠️  Make sure MongoDB is running:');
    console.error('   Windows: net start MongoDB');
    console.error('   Mac: brew services start mongodb-community');
    console.error('   Linux: sudo systemctl start mongod\n');
  });

// API Routes - Import working routes only
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const insightRoutes = require('./routes/insights');
const settingsRoutes = require('./routes/settings');
const exportRoutes = require('./routes/export');
const importRoutes = require('./routes/import');
const receiptRoutes = require('./routes/receipts');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/receipts', receiptRoutes);

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Finova API - Financial Management Platform',
    version: '3.0.0 - Simplified',
    university: 'Munster Technological University, Ireland',
    developers: 'Mofazzal Hossain & Gordan Healy',
    endpoints: ['/api/auth', '/api/accounts', '/api/transactions', '/api/budgets', '/api/goals', '/api/insights', '/api/settings', '/api/export', '/api/import', '/api/receipts']
  });
});

// Root endpoint: serve the React app in packaged/production mode, otherwise show API info.
app.get('/', (req, res) => {
  if (hasFrontendBuild) {
    return res.sendFile(frontendIndex);
  }

  res.json({
    message: 'Finova API - Financial Management Platform',
    version: '3.0.0 - Simplified',
    university: 'Munster Technological University, Ireland',
    developers: 'Mofazzal Hossain & Gordan Healy',
    frontend: 'http://localhost:5173',
    api: 'http://localhost:' + PORT + '/api'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// React Router fallback for packaged/production frontend builds.
if (hasFrontendBuild) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    return res.sendFile(frontendIndex);
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║             SERVER RUNNING! 🚀                        ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  Backend:  http://localhost:${PORT}                     ║`);
  console.log('║  Frontend: http://localhost:5173                      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log('Press Ctrl+C to stop\n');
});

module.exports = app;
