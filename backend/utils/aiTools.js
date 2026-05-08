const EXPENSE_RULES = [
  ['Food & Dining', ['restaurant', 'cafe', 'coffee', 'food', 'pizza', 'burger', 'kfc', 'mcdonald', 'grocery', 'supermarket', 'tesco', 'lidl', 'aldi']],
  ['Transport', ['uber', 'taxi', 'bus', 'train', 'metro', 'fuel', 'petrol', 'diesel', 'parking', 'transport']],
  ['Shopping', ['amazon', 'shopping', 'mall', 'clothing', 'fashion', 'store', 'electronics']],
  ['Bills & Utilities', ['bill', 'electric', 'gas', 'water', 'internet', 'phone', 'utility', 'subscription']],
  ['Rent', ['rent', 'landlord', 'apartment', 'house rent']],
  ['Health', ['pharmacy', 'doctor', 'hospital', 'medicine', 'clinic', 'health']],
  ['Education', ['school', 'college', 'university', 'course', 'book', 'tuition', 'education']],
  ['Entertainment', ['cinema', 'movie', 'netflix', 'spotify', 'game', 'concert', 'entertainment']],
  ['Travel', ['hotel', 'flight', 'airline', 'booking', 'travel', 'airbnb']]
];

function detectCategory(text = '') {
  const haystack = String(text).toLowerCase();
  for (const [category, keywords] of EXPENSE_RULES) {
    if (keywords.some(word => haystack.includes(word))) return category;
  }
  return 'Other';
}

function extractAmount(text = '') {
  const clean = String(text).replace(/,/g, '');
  const labelled = clean.match(/(?:grand total|total|amount|paid|balance|subtotal)\s*[:=-]?\s*(?:€|£|\$|৳|rs\.?|bdt|usd|eur|gbp)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (labelled) return Number(labelled[1]);
  const amounts = [...clean.matchAll(/(?:€|£|\$|৳|rs\.?|bdt|usd|eur|gbp)?\s*([0-9]+(?:\.[0-9]{1,2})?)/gi)]
    .map(m => Number(m[1]))
    .filter(n => Number.isFinite(n) && n > 0);
  return amounts.length ? Math.max(...amounts) : null;
}

function extractDate(text = '') {
  const value = String(text);
  const iso = value.match(/\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b/);
  if (iso) return iso[1].replace(/\//g, '-');
  const dmy = value.match(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  return new Date().toISOString().slice(0, 10);
}

function analyseReceipt({ text = '', filename = '' }) {
  const source = `${filename}\n${text}`;
  const amount = extractAmount(source);
  const category = detectCategory(source);
  const lines = String(text).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const merchant = lines.find(line => !/total|amount|date|receipt|invoice/i.test(line)) || filename.replace(/\.[^.]+$/, '') || 'Receipt import';
  return {
    type: 'expense',
    amount,
    category,
    description: merchant.slice(0, 100),
    date: extractDate(source),
    paymentMethod: /cash/i.test(source) ? 'cash' : /bank|transfer/i.test(source) ? 'bank_transfer' : 'card',
    notes: 'Created from Finova AI receipt/import assistant',
    confidence: amount ? (category === 'Other' ? 0.62 : 0.86) : 0.35,
    extractedText: text
  };
}

module.exports = { analyseReceipt, detectCategory };
