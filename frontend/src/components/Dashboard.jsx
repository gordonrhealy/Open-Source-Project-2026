import React, { useEffect, useMemo, useState } from 'react';
import { accounts, auth, budgets as budgetsApi, exportsApi, importsApi, insightsApi, receiptsApi, transactions, userSettings } from '../services/api.js';

const defaultExpenseCategories = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Rent', 'Health', 'Education', 'Entertainment', 'Travel', 'Other'];
const defaultIncomeCategories = ['Salary', 'Business', 'Freelance', 'Gift', 'Investment', 'Other Income'];
const languageNames = { en: 'English', bn: 'Bangla', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese', ar: 'Arabic' };
const currencySymbols = { EUR: '€', USD: '$', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF ', CNY: '¥', INR: '₹', BDT: '৳' };
const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard({ onLogout }) {
  const [summary, setSummary] = useState({ totalBalance: 0, income: 0, expenses: 0, savings: 0, categoryBreakdown: [] });
  const [items, setItems] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [smartInsights, setSmartInsights] = useState({ forecast: {}, recurring: [], anomalies: [], budgetAlerts: [], trends: [], insights: [] });
  const [categories, setCategories] = useState({ expense: defaultExpenseCategories, income: defaultIncomeCategories });
  const [filter, setFilter] = useState({ type: '', search: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeType, setActiveType] = useState('expense');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem('finova_settings') || '{}'));
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [receiptText, setReceiptText] = useState('');
  const [receiptFile, setReceiptFile] = useState('');
  const [receiptResult, setReceiptResult] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food & Dining', description: '', date: today(), paymentMethod: 'card', notes: '' });
  const [budgetForm, setBudgetForm] = useState({ category: 'Food & Dining', amount: '', period: 'monthly' });

  const resolvedTheme = useMemo(() => {
    const mode = settings.preferences?.theme || 'auto';
    if (mode === 'auto') return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return mode;
  }, [settings]);
  const isDark = resolvedTheme === 'dark';
  const currency = settings.preferences?.currency || 'EUR';
  const money = (value) => `${currencySymbols[currency] || `${currency} `}${Number(value || 0).toFixed(2)}`;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, transactionsRes, categoriesRes, budgetsRes, settingsRes] = await Promise.all([
        accounts.getSummary(),
        transactions.getAll({ limit: 300, ...filter }),
        transactions.categories(),
        budgetsApi.getAll(),
        userSettings.get().catch(() => ({ data: settings }))
      ]);
      const smartRes = await insightsApi.getSmart().catch(() => ({ data: { forecast: {}, recurring: [], anomalies: [], budgetAlerts: [], trends: [], insights: [] } }));
      setSummary(summaryRes.data);
      setItems(transactionsRes.data.transactions || []);
      setCategories(categoriesRes.data || { expense: defaultExpenseCategories, income: defaultIncomeCategories });
      setBudgetItems(budgetsRes.data.budgets || []);
      if (settingsRes.data?.preferences) setSettings(settingsRes.data);
      setSmartInsights(smartRes.data || { forecast: {}, recurring: [], anomalies: [], budgetAlerts: [], trends: [], insights: [] });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    localStorage.setItem('finova_settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings, isDark]);

  const selectedCategories = activeType === 'income' ? categories.income : categories.expense;
  const topCategory = summary.categoryBreakdown?.[0];
  const savingsRate = summary.income > 0 ? Math.round((summary.savings / summary.income) * 100) : 0;
  const totalTransactions = items.length;
  const avgExpense = useMemo(() => {
    const expenses = items.filter(item => item.type === 'expense');
    return expenses.length ? expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) / expenses.length : 0;
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = filter.search.trim().toLowerCase();
    return items.filter(item => {
      const matchesType = !filter.type || item.type === filter.type;
      const matchesSearch = !term || [item.description, item.category, item.notes, item.paymentMethod].join(' ').toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [items, filter]);

  const aiAnswer = useMemo(() => buildAiAnswer(aiQuery, items, summary, money), [aiQuery, items, summary]);

  const handleTypeChange = (type) => {
    setActiveType(type);
    const nextCategory = type === 'income' ? categories.income[0] : categories.expense[0];
    setForm(prev => ({ ...prev, type, category: nextCategory || 'Other' }));
  };

  const saveSettings = async (patch) => {
    setError(''); setMessage('');
    const current = {
      theme: settings.preferences?.theme || 'auto',
      language: settings.preferences?.language || 'en',
      currency: settings.preferences?.currency || 'EUR',
      country: settings.location?.country || '',
      city: settings.location?.city || '',
      timezone: settings.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      ...patch
    };
    try {
      const res = await userSettings.update(current);
      setSettings(res.data);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save settings');
    }
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      await transactions.create({ ...form, type: activeType, currency });
      setMessage(`${activeType === 'income' ? 'Income' : 'Expense'} added successfully.`);
      setForm(prev => ({ ...prev, amount: '', description: '', notes: '', date: today() }));
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save transaction');
    }
  };

  const handleBudgetSubmit = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      await budgetsApi.create({ ...budgetForm, amount: Number(budgetForm.amount) });
      setMessage('Budget added successfully.');
      setBudgetForm({ category: 'Food & Dining', amount: '', period: 'monthly' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save budget');
    }
  };

  const deleteTransaction = async (id) => {
    setError(''); setMessage('');
    try {
      await transactions.remove(id);
      setMessage('Transaction deleted.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete transaction');
    }
  };

  const downloadExport = async (type) => {
    const url = type === 'csv' ? exportsApi.csvUrl() : exportsApi.pdfUrl();
    const response = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = type === 'csv' ? 'finova-transactions.csv' : 'finova-report.pdf';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReceiptFile = async (file) => {
    if (!file) return;
    setReceiptFile(file.name);
    const text = await file.text().catch(() => '');
    setReceiptText(text || `Receipt file: ${file.name}`);
  };

  const analyseReceipt = async () => {
    setError(''); setMessage('');
    try {
      const res = await receiptsApi.analyze({ text: receiptText, filename: receiptFile });
      setReceiptResult(res.data.result);
      setMessage('AI receipt assistant detected the likely amount and category. Review before saving.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not analyze receipt');
    }
  };

  const saveReceiptExpense = async () => {
    setError(''); setMessage('');
    try {
      await receiptsApi.save({ result: receiptResult, filename: receiptFile, currency });
      setMessage('Receipt saved as an expense.');
      setReceiptText(''); setReceiptFile(''); setReceiptResult(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save receipt expense');
    }
  };

  const importCsv = async () => {
    setError(''); setMessage('');
    try {
      const res = await importsApi.csv(csvText);
      setMessage(res.data.message || 'CSV imported.');
      setCsvText('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not import CSV');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      await auth.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change password');
    }
  };

  const shell = isDark ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-100 text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <main className={shell}>
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Finova</p>
            <h1 className="text-3xl lg:text-4xl font-black">Financial Tracking Dashboard</h1>
            <p className={`mt-1 ${muted}`}>Track money, analyze spending, import receipts and customize your workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['dashboard', 'smart', 'settings', 'ai'].map(tab => <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab === 'ai' ? 'AI Search' : tab === 'smart' ? 'Smart Hub' : tab[0].toUpperCase() + tab.slice(1)}</Tab>)}
            <button onClick={onLogout} className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold hover:bg-slate-700">Logout</button>
          </div>
        </header>

        {error && <Alert type="error" text={error} />}
        {message && <Alert type="success" text={message} />}

        {activeTab === 'dashboard' && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <SummaryCard isDark={isDark} title="Total Balance" amount={money(summary.totalBalance)} note="All-time income minus expenses" icon="💰" />
              <SummaryCard isDark={isDark} title="Monthly Income" amount={money(summary.income)} note="Money received this month" icon="📈" positive />
              <SummaryCard isDark={isDark} title="Monthly Expenses" amount={money(summary.expenses)} note="Money spent this month" icon="📉" negative />
              <SummaryCard isDark={isDark} title="Net Savings" amount={money(summary.savings)} note={`${savingsRate}% savings rate`} icon="🎯" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-6">
                <Panel isDark={isDark} title="Add Income or Expense" subtitle="Manual entry for daily tracking">
                  <div className={`grid grid-cols-2 gap-2 mb-4 rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button type="button" onClick={() => handleTypeChange('expense')} className={`rounded-lg py-2 font-semibold ${activeType === 'expense' ? 'bg-red-600 text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Expense</button>
                    <button type="button" onClick={() => handleTypeChange('income')} className={`rounded-lg py-2 font-semibold ${activeType === 'income' ? 'bg-green-600 text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Income</button>
                  </div>

                  <form onSubmit={handleTransactionSubmit} className="space-y-3">
                    <Field label="Amount" isDark={isDark}><input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" /></Field>
                    <Field label="Category" isDark={isDark}><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{selectedCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></Field>
                    <Field label="Description" isDark={isDark}><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder={activeType === 'income' ? 'Salary, freelance payment...' : 'Groceries, rent, bus fare...'} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Date" isDark={isDark}><input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" /></Field>
                      <Field label="Payment" isDark={isDark}><select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="input"><option value="card">Card</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="digital_wallet">Digital wallet</option><option value="other">Other</option></select></Field>
                    </div>
                    <Field label="Notes" isDark={isDark}><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input min-h-[70px]" placeholder="Optional note" /></Field>
                    <button className={`w-full rounded-xl py-3 font-bold text-white ${activeType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Save {activeType}</button>
                  </form>
                </Panel>

                <Panel isDark={isDark} title="Monthly Budget" subtitle="Set category limits">
                  <form onSubmit={handleBudgetSubmit} className="space-y-3">
                    <Field label="Expense category" isDark={isDark}><select value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })} className="input">{categories.expense.map(category => <option key={category} value={category}>{category}</option>)}</select></Field>
                    <Field label="Budget amount" isDark={isDark}><input type="number" min="1" step="0.01" required value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })} className="input" placeholder="Example: 300" /></Field>
                    <button className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">Add Budget</button>
                  </form>
                </Panel>
              </div>

              <div className="xl:col-span-2 space-y-6">
                <Panel isDark={isDark} title="Spending Analytics" subtitle="Category breakdown for this month">
                  {summary.categoryBreakdown?.length ? <div className="space-y-4">{summary.categoryBreakdown.map(item => <div key={item.category}><div className="flex justify-between text-sm mb-1"><span className="font-semibold">{item.category}</span><span>{money(item.total)}</span></div><div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (item.total / Math.max(topCategory?.total || 1, 1)) * 100)}%` }} /></div></div>)}</div> : <Empty isDark={isDark} text="No spending data yet. Add expenses to see category analytics." />}
                </Panel>

                <Panel isDark={isDark} title="Budgets" subtitle="Track spending against monthly limits">
                  {budgetItems.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{budgetItems.map(budget => <div key={budget._id} className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200'}`}><div className="flex items-center justify-between mb-2"><h3 className="font-bold">{budget.category}</h3><span className={`text-sm font-bold ${budget.percentageUsed > 100 ? 'text-red-500' : 'text-blue-500'}`}>{budget.percentageUsed}%</span></div><div className={`text-sm mb-3 ${muted}`}>Spent {money(budget.spent)} of {money(budget.amount)} · Remaining {money(budget.remaining)}</div><div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}><div className={`h-full rounded-full ${budget.percentageUsed > 100 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${Math.min(100, budget.percentageUsed)}%` }} /></div></div>)}</div> : <Empty isDark={isDark} text="No budgets yet. Add one to monitor category spending." />}
                </Panel>

                <Panel isDark={isDark} title="Transactions" subtitle="Search, filter and delete your records">
                  <div className="flex flex-col md:flex-row gap-3 mb-4"><input value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="input" placeholder="Search description, category or notes" /><select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="input md:w-48"><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select><button onClick={loadData} className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">Refresh</button></div>
                  {loading ? <Empty isDark={isDark} text="Loading financial data..." /> : filteredItems.length ? <TransactionTable items={filteredItems} money={money} isDark={isDark} onDelete={deleteTransaction} /> : <Empty isDark={isDark} text="No transactions found. Add your first income or expense from the form." />}
                </Panel>
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg">
              <h2 className="text-xl font-black mb-2">Smart Financial Insight</h2>
              <p className="text-blue-50">{summary.expenses > summary.income && summary.income > 0 ? 'Your expenses are higher than your income this month. Review your largest categories and set stronger budgets.' : topCategory ? `${topCategory.category} is your largest spending category this month at ${money(topCategory.total)}.` : 'Add income, expenses and budgets to unlock spending insights and cash-flow tracking.'}</p>
            </section>
          </>
        )}


        {activeTab === 'smart' && (
          <section className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard isDark={isDark} title="Forecasted Expense" amount={money(smartInsights.forecast?.forecastExpense)} note="Projected month-end spend" icon="🔮" negative />
              <SummaryCard isDark={isDark} title="Projected Savings" amount={money(smartInsights.forecast?.projectedSavings)} note="Income minus projected expenses" icon="🧠" positive={Number(smartInsights.forecast?.projectedSavings || 0) >= 0} negative={Number(smartInsights.forecast?.projectedSavings || 0) < 0} />
              <SummaryCard isDark={isDark} title="Daily Burn" amount={money(smartInsights.forecast?.dailyAverageExpense)} note="Average expense per day" icon="🔥" />
              <SummaryCard isDark={isDark} title="Alerts" amount={(smartInsights.anomalies?.length || 0) + (smartInsights.budgetAlerts?.length || 0)} note="Anomaly + budget warnings" icon="🚨" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Panel isDark={isDark} title="AI Financial Copilot" subtitle="Automatic recommendations from spending, budgets and recurring patterns">
                <div className="space-y-3">
                  {smartInsights.insights?.length ? smartInsights.insights.map((item, index) => <InsightCard key={index} item={item} isDark={isDark} />) : <Empty isDark={isDark} text="Add more transactions and budgets to unlock personalized financial recommendations." />}
                </div>
              </Panel>

              <Panel isDark={isDark} title="Recurring Detector" subtitle="Find subscriptions, rent, repeated bills and salary-like patterns">
                <div className="space-y-3">
                  {smartInsights.recurring?.length ? smartInsights.recurring.map((item, index) => <div key={index} className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}><div className="flex justify-between gap-3"><div><h3 className="font-black">{item.description}</h3><p className={muted}>{item.category} · {item.frequency}</p></div><div className="text-right"><p className="font-black">{money(item.amount)}</p><p className="text-xs text-blue-500">{Math.round((item.confidence || 0) * 100)}% confidence</p></div></div><p className={`mt-2 text-sm ${muted}`}>Next expected: {item.nextExpectedDate}</p></div>) : <Empty isDark={isDark} text="No recurring pattern detected yet." />}
                </div>
              </Panel>

              <Panel isDark={isDark} title="Smart Alerts" subtitle="Budget pressure and unusual transactions">
                <div className="space-y-3">
                  {smartInsights.budgetAlerts?.map(item => <div key={`budget-${item.id}`} className={`rounded-xl border p-4 ${item.status === 'over' ? 'border-red-300 bg-red-50 text-red-800' : isDark ? 'border-yellow-700 bg-yellow-950/30' : 'border-yellow-300 bg-yellow-50'}`}><h3 className="font-black">{item.category} budget</h3><p className="text-sm">{item.percentageUsed}% used · {money(item.remaining)} remaining</p></div>)}
                  {smartInsights.anomalies?.map(item => <div key={`anomaly-${item.id}`} className={`rounded-xl border p-4 ${isDark ? 'border-red-800 bg-red-950/30' : 'border-red-200 bg-red-50'}`}><h3 className="font-black">{item.description}</h3><p className="text-sm">{money(item.amount)} · {item.reason}</p></div>)}
                  {!smartInsights.budgetAlerts?.length && !smartInsights.anomalies?.length && <Empty isDark={isDark} text="No serious alerts right now." />}
                </div>
              </Panel>
            </section>

            <Panel isDark={isDark} title="Category Momentum" subtitle="Compares this month with the previous month">
              {smartInsights.trends?.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{smartInsights.trends.map(item => <div key={item.category} className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}><div className="flex items-center justify-between"><h3 className="font-black">{item.category}</h3><span className={`font-black ${item.changePercent > 0 ? 'text-red-500' : 'text-green-500'}`}>{item.changePercent > 0 ? '+' : ''}{item.changePercent}%</span></div><p className={`mt-2 text-sm ${muted}`}>Current {money(item.current)} · Previous {money(item.previous)}</p></div>)}</div> : <Empty isDark={isDark} text="Not enough previous-month data for trend comparison." />}
            </Panel>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel isDark={isDark} title="Appearance & Locale" subtitle="Theme, language, currency, location and timezone">
              <div className="space-y-3">
                <Field label="Theme" isDark={isDark}><select className="input" value={settings.preferences?.theme || 'auto'} onChange={e => saveSettings({ theme: e.target.value })}><option value="light">Light mode</option><option value="dark">Dark mode</option><option value="auto">System default</option></select></Field>
                <Field label="Language" isDark={isDark}><select className="input" value={settings.preferences?.language || 'en'} onChange={e => saveSettings({ language: e.target.value })}>{Object.entries(languageNames).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field>
                <Field label="Currency" isDark={isDark}><select className="input" value={currency} onChange={e => saveSettings({ currency: e.target.value })}>{['EUR','USD','GBP','BDT','INR','JPY','AUD','CAD','CHF','CNY'].map(c => <option key={c} value={c}>{c} {currencySymbols[c]}</option>)}</select></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="City" isDark={isDark}><input className="input" value={settings.location?.city || ''} onChange={e => setSettings(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))} onBlur={e => saveSettings({ city: e.target.value })} placeholder="Cork" /></Field><Field label="Country" isDark={isDark}><input className="input" value={settings.location?.country || ''} onChange={e => setSettings(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))} onBlur={e => saveSettings({ country: e.target.value })} placeholder="Ireland" /></Field></div>
                <Field label="Timezone" isDark={isDark}><input className="input" value={settings.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'} onChange={e => setSettings(prev => ({ ...prev, location: { ...prev.location, timezone: e.target.value } }))} onBlur={e => saveSettings({ timezone: e.target.value })} placeholder="Europe/Dublin" /></Field>
              </div>
            </Panel>

            <Panel isDark={isDark} title="Export & Import" subtitle="Download CSV/PDF reports or bulk import transactions">
              <div className="grid grid-cols-2 gap-3 mb-4"><button onClick={() => downloadExport('csv')} className="rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700">Export CSV</button><button onClick={() => downloadExport('pdf')} className="rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700">Export PDF</button></div>
              <Field label="CSV import" isDark={isDark}><textarea className="input min-h-[150px]" value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={'date,type,category,description,amount,currency,notes\n2026-05-05,expense,Food & Dining,Coffee,4.50,EUR,Imported'} /></Field>
              <button onClick={importCsv} disabled={!csvText.trim()} className="mt-3 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">Import CSV</button>
            </Panel>

            <Panel isDark={isDark} title="Security" subtitle="Change your account password">
              <form onSubmit={changePassword} className="space-y-3">
                <Field label="Current password" isDark={isDark}><input type="password" className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required /></Field>
                <Field label="New password" isDark={isDark}><input type="password" minLength="8" className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required /></Field>
                <button className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700">Change Password</button>
              </form>
            </Panel>

            <Panel isDark={isDark} title="AI Receipt Assistant" subtitle="Paste receipt text or import a text/CSV receipt file, then review the detected expense">
              <input type="file" accept=".txt,.csv,.json" onChange={e => handleReceiptFile(e.target.files?.[0])} className="mb-3 block w-full text-sm" />
              <Field label="Receipt text" isDark={isDark}><textarea className="input min-h-[150px]" value={receiptText} onChange={e => setReceiptText(e.target.value)} placeholder={'Example:\nTESCO\nDate 05/05/2026\nTotal €24.80\nPaid by card'} /></Field>
              <button onClick={analyseReceipt} disabled={!receiptText.trim() && !receiptFile} className="mt-3 w-full rounded-xl bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-50">Detect Amount & Category</button>
              {receiptResult && <div className={`mt-4 rounded-xl p-4 text-sm ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}><div className="font-black mb-2">Detected result</div><p>Amount: <b>{money(receiptResult.amount)}</b></p><p>Category: <b>{receiptResult.category}</b></p><p>Description: <b>{receiptResult.description}</b></p><p>Date: <b>{receiptResult.date}</b></p><p>Confidence: <b>{Math.round((receiptResult.confidence || 0) * 100)}%</b></p><button onClick={saveReceiptExpense} className="mt-3 w-full rounded-xl bg-green-600 py-2 font-bold text-white hover:bg-green-700">Save as Expense</button></div>}
            </Panel>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2"><Panel isDark={isDark} title="AI Search Command Center" subtitle="Ask natural-language finance questions from your own transactions"><input className="input text-lg" value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Try: biggest expense, food spending, transport this month, subscriptions, cash payments" /><div className={`mt-4 rounded-2xl p-5 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}><h3 className="font-black mb-2">Answer</h3><p className={muted}>{aiAnswer.answer}</p>{aiAnswer.items?.length > 0 && <div className="mt-4"><TransactionTable items={aiAnswer.items} money={money} isDark={isDark} onDelete={deleteTransaction} compact /></div>}</div></Panel></div>
            <Panel isDark={isDark} title="Premium Signals" subtitle="Modern finance-product intelligence">
              <Signal label="Cashflow Health" value={summary.savings >= 0 ? 'Healthy' : 'Attention needed'} tone={summary.savings >= 0 ? 'green' : 'red'} />
              <Signal label="Runway Trend" value={`${savingsRate}% savings rate`} tone={savingsRate >= 20 ? 'green' : savingsRate >= 0 ? 'blue' : 'red'} />
              <Signal label="Avg Expense" value={money(avgExpense)} tone="blue" />
              <Signal label="Transactions Analysed" value={totalTransactions} tone="blue" />
              <div className={`mt-4 rounded-xl p-4 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>Finova now includes local AI-style categorisation, receipt parsing, natural-language transaction search, anomaly hints and cash-flow health scoring.</div>
            </Panel>
          </section>
        )}
      </div>
    </main>
  );
}

function buildAiAnswer(query, items, summary, money) {
  const q = query.trim().toLowerCase();
  if (!q) return { answer: 'Ask a question about your income, expenses, categories, merchants, payment methods or budgets.', items: [] };
  let results = items;
  if (q.includes('income')) results = results.filter(i => i.type === 'income');
  if (q.includes('expense') || q.includes('spend') || q.includes('spent')) results = results.filter(i => i.type === 'expense');
  ['food', 'transport', 'shopping', 'bill', 'rent', 'health', 'education', 'entertainment', 'travel'].forEach(word => { if (q.includes(word)) results = results.filter(i => `${i.category} ${i.description}`.toLowerCase().includes(word)); });
  ['cash', 'card', 'bank', 'wallet'].forEach(word => { if (q.includes(word)) results = results.filter(i => String(i.paymentMethod || '').toLowerCase().includes(word)); });
  if (q.includes('biggest') || q.includes('largest') || q.includes('highest')) results = [...results].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);
  if (q.includes('recent') || q.includes('latest')) results = [...results].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);
  const total = results.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const base = results.length ? `I found ${results.length} matching transaction${results.length === 1 ? '' : 's'} totaling ${money(total)}.` : 'I could not find matching transactions yet.';
  const insight = summary.expenses > summary.income && summary.income > 0 ? ' Your monthly spending is currently above income.' : '';
  return { answer: base + insight, items: results.slice(0, 12) };
}

function Tab({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-xl px-4 py-2.5 font-bold ${active ? 'bg-blue-600 text-white' : 'bg-white/10 text-inherit border border-slate-300/30'}`}>{children}</button>; }
function Alert({ type, text }) { const className = type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'; return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}>{text}</div>; }
function Panel({ title, subtitle, children, isDark }) { return <section className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}><div className="mb-4"><h2 className="text-xl font-black">{title}</h2>{subtitle && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}</div>{children}</section>; }
function Field({ label, children, isDark }) { return <label className="block"><span className={`mb-1 block text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>{children}</label>; }
function Empty({ text, isDark }) { return <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{text}</div>; }
function SummaryCard({ title, amount, note, icon, positive, negative, isDark }) { const valueClass = positive ? 'text-green-500' : negative ? 'text-red-500' : isDark ? 'text-slate-100' : 'text-slate-900'; return <div className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}><div className="mb-3 flex items-center justify-between"><span className="text-3xl">{icon}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>LIVE</span></div><h3 className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3><p className={`mt-1 text-3xl font-black ${valueClass}`}>{amount}</p><p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{note}</p></div>; }
function TransactionTable({ items, money, isDark, onDelete, compact }) { return <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}><table className="w-full text-sm"><thead className={`${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'} text-left`}><tr><th className="p-3">Date</th><th className="p-3">Details</th><th className="p-3">Category</th><th className="p-3 text-right">Amount</th>{!compact && <th className="p-3"></th>}</tr></thead><tbody className={`divide-y ${isDark ? 'divide-slate-800 bg-slate-900' : 'divide-slate-100 bg-white'}`}>{items.map(item => <tr key={item._id}><td className={`p-3 whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.date}</td><td className="p-3"><div className="font-semibold">{item.description}</div>{item.notes && <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.notes}</div>}</td><td className="p-3">{item.category}</td><td className={`p-3 text-right font-bold ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{item.type === 'income' ? '+' : '-'}{money(item.amount)}</td>{!compact && <td className="p-3 text-right"><button onClick={() => onDelete(item._id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button></td>}</tr>)}</tbody></table></div>; }
function Signal({ label, value, tone }) { const color = tone === 'green' ? 'text-green-500' : tone === 'red' ? 'text-red-500' : 'text-blue-500'; return <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-300/20 p-3"><span className="text-sm font-bold opacity-80">{label}</span><span className={`font-black ${color}`}>{value}</span></div>; }
function InsightCard({ item, isDark }) { const toneClass = item.tone === 'red' ? 'border-red-300 bg-red-50 text-red-800' : item.tone === 'yellow' ? 'border-yellow-300 bg-yellow-50 text-yellow-800' : isDark ? 'border-blue-900 bg-blue-950/40 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900'; return <div className={`rounded-xl border p-4 ${toneClass}`}><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm opacity-90">{item.detail}</p></div>; }
