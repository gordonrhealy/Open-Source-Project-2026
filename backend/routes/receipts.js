const express = require('express');
const router = express.Router();
const authRequired = require('../middleware_auth');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { analyseReceipt } = require('../utils/aiTools');

router.use(authRequired);

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

router.post('/analyze', async (req, res) => {
  const result = analyseReceipt({ text: req.body.text || '', filename: req.body.filename || '' });
  res.json({ result });
});

router.post('/save', async (req, res) => {
  try {
    const result = req.body.result || analyseReceipt({ text: req.body.text || '', filename: req.body.filename || '' });
    if (!result.amount || Number(result.amount) <= 0) return res.status(400).json({ error: 'Could not detect a valid amount' });
    const account = await getDefaultAccount(req.user._id);
    const transaction = await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: 'expense',
      amount: Number(result.amount),
      currency: req.body.currency || req.user.preferences?.currency || 'EUR',
      category: result.category || 'Other',
      description: result.description || 'Receipt import',
      notes: result.notes || 'Created from Finova AI receipt assistant',
      date: result.date || new Date().toISOString().slice(0, 10),
      paymentMethod: result.paymentMethod || 'card',
      importSource: 'receipt_ocr',
      aiCategorized: true,
      aiConfidence: result.confidence || 0.5,
      receipts: [{ filename: req.body.filename || 'receipt', ocrData: { extractedText: result.extractedText || req.body.text || '', totalAmount: Number(result.amount), date: result.date, confidence: result.confidence || 0.5 } }]
    });
    res.status(201).json({ message: 'Receipt saved as expense', transaction });
  } catch (error) {
    console.error('Receipt save error:', error);
    res.status(500).json({ error: 'Failed to save receipt expense' });
  }
});

module.exports = router;
