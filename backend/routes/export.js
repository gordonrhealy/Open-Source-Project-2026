const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authRequired = require('../middleware_auth');

router.use(authRequired);

function escapeCsv(value) {
  const raw = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function buildCsv(rows) {
  const header = ['date', 'type', 'category', 'description', 'amount', 'currency', 'paymentMethod', 'notes'];
  const lines = [header.join(',')];
  rows.forEach(t => {
    lines.push(header.map(key => escapeCsv(t[key])).join(','));
  });
  return lines.join('\n');
}

function buildSimplePdf(lines) {
  const safe = lines.map(line => String(line).replace(/[()\\]/g, '\\$&'));
  const content = ['BT', '/F1 12 Tf', '50 790 Td'];
  safe.forEach((line, index) => {
    if (index > 0) content.push('0 -18 Td');
    content.push(`(${line}) Tj`);
  });
  content.push('ET');
  const stream = content.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach(obj => { offsets.push(Buffer.byteLength(pdf)); pdf += obj + '\n'; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

async function getTransactions(userId) {
  return Transaction.find({ user: userId, isDeleted: false, type: { $in: ['income', 'expense'] } })
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

router.get('/csv', async (req, res) => {
  try {
    const rows = await getTransactions(req.user._id);
    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="finova-transactions.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

router.get('/pdf', async (req, res) => {
  try {
    const rows = await getTransactions(req.user._id);
    const totalIncome = rows.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpense = rows.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const lines = [
      'Finova Financial Export',
      `Generated: ${new Date().toLocaleString()}`,
      `Total income: ${totalIncome.toFixed(2)}`,
      `Total expense: ${totalExpense.toFixed(2)}`,
      `Net balance: ${(totalIncome - totalExpense).toFixed(2)}`,
      ' ',
      'Latest transactions:'
    ];
    rows.slice(0, 28).forEach(t => lines.push(`${t.date} | ${t.type} | ${t.category} | ${t.description} | ${Number(t.amount).toFixed(2)} ${t.currency || ''}`));
    const pdf = buildSimplePdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="finova-report.pdf"');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;
