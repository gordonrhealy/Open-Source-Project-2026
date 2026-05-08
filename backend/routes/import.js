const express = require('express');
const router = express.Router();
const authRequired = require('../middleware_auth');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { detectCategory } = require('../utils/aiTools');

router.use(authRequired);

function parseCsv(csv) {
  return String(csv || '').split(/\r?\n/).filter(Boolean).map(line => {
    const values = line.match(/("(?:""|[^"])*"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
    return values;
  });
}

async function getDefaultAccount(userId) {
  let account = await Account.findOne({ user: userId, name: 'Cash Wallet' });
  if (!account) {
    account = await Account.create({ user: userId, name: 'Cash Wallet', type: 'cash', currency: 'EUR', initialBalance: 0, balance: { current: 0, available: 0, pending: 0 } });
  }
  return account;
}

router.post('/csv', async (req, res) => {
  try {
    const rows = parseCsv(req.body.csv);
    if (rows.length < 2) return res.status(400).json({ error: 'CSV must include a header row and at least one transaction' });
    const header = rows[0].map(h => h.toLowerCase());
    const index = name => header.indexOf(name);
    const account = await getDefaultAccount(req.user._id);
    const created = [];

    for (const values of rows.slice(1)) {
      const description = values[index('description')] || values[index('merchant')] || 'Imported transaction';
      const rawType = (values[index('type')] || '').toLowerCase();
      const amount = Math.abs(Number(values[index('amount')] || 0));
      if (!amount) continue;
      const type = rawType === 'income' || rawType === 'expense' ? rawType : 'expense';
      const category = values[index('category')] || detectCategory(description);
      const date = values[index('date')] || new Date().toISOString().slice(0, 10);
      const transaction = await Transaction.create({
        user: req.user._id,
        account: account._id,
        type,
        amount,
        currency: values[index('currency')] || req.user.preferences?.currency || 'EUR',
        category,
        description,
        notes: values[index('notes')] || 'CSV import',
        date,
        paymentMethod: values[index('paymentmethod')] || 'card',
        importSource: 'csv',
        importedAt: new Date(),
        aiCategorized: !values[index('category')]
      });
      created.push(transaction);
    }

    res.status(201).json({ message: `${created.length} transactions imported`, count: created.length });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

module.exports = router;
