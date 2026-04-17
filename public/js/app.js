/* ═══════════════════════════════════════════════════════
   Finova — Frontend Application
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── CONFIG ────────────────────────────────────────────────
const API = '/api';
const CHART_COLORS = [
  '#c9a84c','#22c55e','#3b82f6','#ef4444',
  '#8b5cf6','#f59e0b','#ec4899','#14b8a6',
  '#0ea5e9','#a855f7','#84cc16','#f97316',
];
const CAT_ICONS = {
  Income:'💰', Housing:'🏠', Food:'🍽', Transport:'🚗',
  Utilities:'⚡', Entertainment:'🎬', Health:'❤️',
  Shopping:'🛍', Education:'📚', Travel:'✈️', Savings:'🏦', Other:'📦',
};
const CURRENCIES = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', CAD:'C$', AUD:'A$', INR:'₹', CHF:'Fr' };

// ── STATE ─────────────────────────────────────────────────
let token    = localStorage.getItem('finova_token') || null;
let user     = JSON.parse(localStorage.getItem('finova_user') || 'null');
let currency = '$';
let transactions = [];

let donutChart = null, pieChart = null, barChart = null, lineChart = null;
let pendingAction = null;

// ── CHART DEFAULTS ────────────────────────────────────────
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'DM Sans';
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;

// ══════════════════════════════════════════════════════════
//  API LAYER
// ══════════════════════════════════════════════════════════
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    throw err;
  }
}

// ── Helper shortcuts
const GET    = (path)        => api('GET',    path);
const POST   = (path, body)  => api('POST',   path, body);
const PATCH  = (path, body)  => api('PATCH',  path, body);
const PUT    = (path, body)  => api('PUT',    path, body);
const DELETE = (path, body)  => api('DELETE', path, body);

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
function fmt(n) {
  const abs = Math.abs(n);
  return currency + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function currentMonth() { return new Date().toISOString().slice(0, 7); }

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ══════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════
function toast(msg, type = 'success', duration = 3500) {
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ══════════════════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════════════════
function openModal(title, text, confirmLabel = 'Confirm', confirmClass = 'btn-danger') {
  return new Promise((resolve) => {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent  = text;
    const btn = document.getElementById('modalConfirmBtn');
    btn.textContent = confirmLabel;
    btn.className = `btn ${confirmClass}`;
    document.getElementById('appModal').classList.add('open');
    pendingAction = resolve;
  });
}

function closeModal(confirmed = false) {
  document.getElementById('appModal').classList.remove('open');
  if (pendingAction) { pendingAction(confirmed); pendingAction = null; }
}

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
let authTab = 'login';

function setAuthTab(mode) {
  authTab = mode;
  qsa('.auth-tab').forEach((b, i) => b.classList.toggle('active', (i === 0) === (mode === 'login')));
  document.getElementById('authSubmit').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('authError').textContent = '';
  document.getElementById('emailField').style.display = mode === 'register' ? 'block' : 'none';
}

async function handleAuth() {
  const username = getVal('authUser');
  const password = getVal('authPass');
  const errEl    = document.getElementById('authError');

  if (!username || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  const btn = document.getElementById('authSubmit');
  btn.innerHTML = '<span class="spinner"></span> Please wait...';
  btn.disabled = true;
  errEl.textContent = '';

  try {
    const body = { username, password };
    if (authTab === 'register') {
      const email = getVal('authEmail');
      if (email) body.email = email;
    }

    const path = authTab === 'login' ? '/auth/login' : '/auth/register';
    const data = await POST(path, body);

    token = data.token;
    user  = data.user;
    currency = CURRENCIES[user.currency] || '$';

    localStorage.setItem('finova_token', token);
    localStorage.setItem('finova_user', JSON.stringify(user));

    if (authTab === 'register') {
      toast('Account created!', 'success');
    }

    await bootApp();
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.innerHTML = authTab === 'login' ? 'Sign In' : 'Create Account';
    btn.disabled = false;
  }
}

async function logout() {
  token = null; user = null; transactions = [];
  localStorage.removeItem('finova_token');
  localStorage.removeItem('finova_user');

  destroyCharts();
  document.getElementById('mainApp').style.display    = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  setVal('authUser', ''); setVal('authPass', '');
  document.getElementById('authError').textContent = '';
}

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════
async function bootApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').style.display    = 'block';

  currency = CURRENCIES[user.currency] || '$';
  document.getElementById('sidebarUserName').textContent = user.username;
  document.getElementById('sidebarAvatar').textContent   = user.username[0].toUpperCase();

  const h = new Date().getHours();
  const gr = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashGreeting').textContent = `${gr}, ${user.username} 👋`;

  setVal('incomeDate', todayISO());
  setVal('expDate', todayISO());

  await loadTransactions();
  showPage('dashboard');
}

// ══════════════════════════════════════════════════════════
//  LOAD DATA
// ══════════════════════════════════════════════════════════
async function loadTransactions() {
  try {
    const data = await GET('/transactions?limit=500&sort=-date');
    transactions = data.transactions || [];
  } catch (err) {
    toast('Failed to load data: ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════
function showPage(id, navEl) {
  qsa('.page').forEach(p => p.classList.remove('active'));
  qsa('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else { const btn = document.querySelector(`[data-page="${id}"]`); if (btn) btn.classList.add('active'); }

  if (window.innerWidth <= 960) closeSidebar();

  const map = {
    dashboard: refreshDashboard,
    history:   refreshHistory,
    charts:    refreshCharts,
    budget:    refreshBudgets,
    settings:  refreshSettings,
  };
  if (map[id]) map[id]();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ══════════════════════════════════════════════════════════
//  ADD INCOME
// ══════════════════════════════════════════════════════════
async function addIncome() {
  const amount   = parseFloat(getVal('incomeAmount'));
  const name     = getVal('incomeSource') || 'Income';
  const date     = getVal('incomeDate') || todayISO();
  const note     = getVal('incomeNote');
  const category = 'Income';

  if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  const btn = document.getElementById('btnAddIncome');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const data = await POST('/transactions', { type: 'income', name, amount, category, date, note });
    transactions.unshift(data.transaction);
    toast('Income added!');
    clearForm('incomeAmount', 'incomeSource', 'incomeNote');
    setVal('incomeDate', todayISO());
    refreshDashboard();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '➕ Add Income';
  }
}

// ══════════════════════════════════════════════════════════
//  ADD EXPENSE
// ══════════════════════════════════════════════════════════
async function addExpense() {
  const name     = getVal('expName');
  const amount   = parseFloat(getVal('expAmount'));
  const category = getVal('expCategory');
  const date     = getVal('expDate') || todayISO();
  const note     = getVal('expNote');

  if (!name)                          { toast('Enter expense name', 'error'); return; }
  if (isNaN(amount) || amount <= 0)   { toast('Enter a valid amount', 'error'); return; }

  const btn = document.getElementById('btnAddExpense');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const data = await POST('/transactions', { type: 'expense', name, amount, category, date, note });
    transactions.unshift(data.transaction);
    toast('Expense recorded!');
    clearForm('expName', 'expAmount', 'expNote');
    setVal('expDate', todayISO());
    refreshDashboard();
    checkBudgetAlert(category, amount);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '➕ Add Expense';
  }
}

async function checkBudgetAlert(category, newAmount) {
  try {
    const data = await GET(`/budgets?month=${currentMonth()}`);
    const bud = data.budgets.find(b => b.category === category);
    if (!bud) return;
    const pct = ((bud.spent + newAmount) / bud.limit) * 100;
    if (pct >= 100) toast(`⚠️ ${category} budget exceeded! (${fmt(bud.spent + newAmount)} / ${fmt(bud.limit)})`, 'error', 5000);
    else if (pct >= 80) toast(`⚠️ ${category} budget at ${Math.round(pct)}%`, 'info', 4000);
  } catch (_) {}
}

function clearForm(...ids) {
  ids.forEach(id => setVal(id, ''));
}

// ══════════════════════════════════════════════════════════
//  DELETE TRANSACTION
// ══════════════════════════════════════════════════════════
async function deleteTransaction(id) {
  const confirmed = await openModal('Delete Transaction?', 'This will permanently remove this entry and cannot be undone.', 'Delete', 'btn-danger');
  if (!confirmed) return;
  try {
    await DELETE('/transactions/' + id);
    transactions = transactions.filter(t => t._id !== id);
    toast('Deleted.', 'info');
    refreshDashboard();
    refreshHistory();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function resetAllData() {
  const confirmed = await openModal('Reset All Data?', 'This will permanently delete ALL your transactions. This cannot be undone.', 'Reset Everything', 'btn-danger');
  if (!confirmed) return;
  try {
    await DELETE('/transactions');
    transactions = [];
    toast('All data cleared.', 'info');
    refreshDashboard();
    refreshHistory();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function refreshDashboard() {
  const txns     = transactions;
  const income   = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;
  const savings  = income > 0 ? Math.round((balance / income) * 100) : 0;

  setText('dashIncome',   fmt(income));
  setText('dashExpenses', fmt(expenses));
  setText('dashBalance',  (balance < 0 ? '-' : '') + fmt(balance));
  setText('dashSavings',  savings + '%');
  setText('dashIncSub',   txns.filter(t => t.type === 'income').length + ' entries');
  setText('dashExpSub',   txns.filter(t => t.type === 'expense').length + ' transactions');
  setText('dashBalSub',   savings >= 0 ? savings + '% savings rate' : 'Overspent');
  setText('dashSavSub',   income > 0 ? fmt(income - expenses) + ' saved' : 'No income yet');

  // Insights
  const catTotals = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  setText('insTopCat',    topCat ? `${CAT_ICONS[topCat[0]] || ''} ${topCat[0]}` : '—');
  setText('insTopCatAmt', topCat ? fmt(topCat[1]) : '');

  const expDates = [...new Set(txns.filter(t => t.type === 'expense').map(t => t.date?.slice(0,10)))];
  const avgDaily = expDates.length > 0 ? expenses / expDates.length : 0;
  setText('insAvgDaily', fmt(avgDaily));

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthlyExp = txns.filter(t => t.type === 'expense' && (t.date||'').slice(0,7) === monthKey)
    .reduce((s, t) => s + t.amount, 0);
  setText('insThisMonth', fmt(monthlyExp));

  const last = txns[0];
  setText('insLastTxn', last ? `${last.name} (${fmt(last.amount)})` : '—');

  // Recent transactions
  const recent = txns.slice(0, 6);
  const recentEl = document.getElementById('recentList');
  document.getElementById('recentCount').textContent = txns.length;
  if (recent.length === 0) {
    recentEl.innerHTML = `<div class="empty-state"><span class="empty-icon">💸</span><h3>No transactions yet</h3><p>Add your first income or expense to get started.</p></div>`;
  } else {
    recentEl.innerHTML = `
      <div class="table-wrap">
      <table><thead><tr><th>Date</th><th>Name</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead>
      <tbody>
      ${recent.map(t => `<tr>
        <td>${fmtDate(t.date)}</td>
        <td>${t.name}</td>
        <td><span class="pill pill-${t.category}">${CAT_ICONS[t.category]||''} ${t.category}</span></td>
        <td><span class="pill pill-${t.type}-type">${t.type}</span></td>
        <td class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
      </tr>`).join('')}
      </tbody></table></div>`;
  }

  // Donut chart
  updateDonutChart(catTotals);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ══════════════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════════════
function refreshHistory() {
  const search = (getVal('filterSearch') || '').toLowerCase();
  const type   = getVal('filterType');
  const cat    = getVal('filterCat');
  const sort   = getVal('filterSort') || 'newest';
  const startD = getVal('filterStart');
  const endD   = getVal('filterEnd');

  let txns = [...transactions];

  if (search) txns = txns.filter(t => t.name.toLowerCase().includes(search) || (t.note||'').toLowerCase().includes(search));
  if (type)   txns = txns.filter(t => t.type === type);
  if (cat)    txns = txns.filter(t => t.category === cat);
  if (startD) txns = txns.filter(t => (t.date||'').slice(0,10) >= startD);
  if (endD)   txns = txns.filter(t => (t.date||'').slice(0,10) <= endD);

  const sortMap = {
    newest:  (a,b) => new Date(b.date) - new Date(a.date),
    oldest:  (a,b) => new Date(a.date) - new Date(b.date),
    highest: (a,b) => b.amount - a.amount,
    lowest:  (a,b) => a.amount - b.amount,
  };
  txns.sort(sortMap[sort] || sortMap.newest);

  const tbody = document.getElementById('historyBody');
  const empty = document.getElementById('historyEmpty');

  if (txns.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Subtotals
  const totalF = txns.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const totalE = txns.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  document.getElementById('histFilterIncome').textContent  = '+' + fmt(totalF);
  document.getElementById('histFilterExpense').textContent = '-' + fmt(totalE);
  document.getElementById('histFilterNet').textContent     = fmt(totalF - totalE);

  tbody.innerHTML = txns.map(t => `
    <tr>
      <td>${fmtDate(t.date)}</td>
      <td>${escHtml(t.name)}</td>
      <td><span class="pill pill-${t.category}">${CAT_ICONS[t.category]||''} ${t.category}</span></td>
      <td><span class="pill pill-${t.type}-type">${t.type}</span></td>
      <td class="${t.type==='income'?'amount-income':'amount-expense'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
      <td style="color:var(--text-dim);font-size:12px">${escHtml(t.note||'—')}</td>
      <td>
        <button class="icon-btn delete" onclick="deleteTransaction('${t._id}')" title="Delete">🗑</button>
      </td>
    </tr>`).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ══════════════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════════════
function destroyCharts() {
  [donutChart, pieChart, barChart, lineChart].forEach(c => c && c.destroy());
  donutChart = pieChart = barChart = lineChart = null;
}

function updateDonutChart(catTotals) {
  const labels = Object.keys(catTotals);
  const values = Object.values(catTotals);
  const ctx = document.getElementById('donutChart')?.getContext('2d');
  if (!ctx) return;

  if (!donutChart) {
    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 10 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { position: 'bottom' } },
      },
    });
  } else {
    donutChart.data.labels = labels;
    donutChart.data.datasets[0].data = values;
    donutChart.update();
  }
}

function refreshCharts() {
  const txns = transactions;

  // Pie — category breakdown
  const catTotals = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  if (pieCtx) {
    if (pieChart) { pieChart.data.labels = Object.keys(catTotals); pieChart.data.datasets[0].data = Object.values(catTotals); pieChart.update(); }
    else {
      pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: { labels: Object.keys(catTotals), datasets: [{ data: Object.values(catTotals), backgroundColor: CHART_COLORS, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
      });
    }
  }

  // Bar — monthly income vs expenses
  const monthly = {};
  txns.forEach(t => {
    const m = (t.date||'').slice(0, 7);
    if (!m) return;
    if (!monthly[m]) monthly[m] = { income: 0, expense: 0 };
    monthly[m][t.type] += t.amount;
  });
  const months      = Object.keys(monthly).sort();
  const monthInc    = months.map(m => monthly[m].income);
  const monthExp    = months.map(m => monthly[m].expense);
  const monthLabels = months.map(m => { const [y,mo] = m.split('-'); return new Date(y, mo-1).toLocaleDateString('en-US', { month:'short', year:'2-digit' }); });

  const barCtx = document.getElementById('barChart')?.getContext('2d');
  const gridColor = 'rgba(255,255,255,0.05)';
  const tickColor = '#94a3b8';
  if (barCtx) {
    if (barChart) {
      barChart.data.labels = monthLabels;
      barChart.data.datasets[0].data = monthInc;
      barChart.data.datasets[1].data = monthExp;
      barChart.update();
    } else {
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            { label: 'Income',   data: monthInc,  backgroundColor: 'rgba(34,197,94,0.75)',  borderRadius: 6 },
            { label: 'Expenses', data: monthExp, backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, callback: v => currency + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
          },
        },
      });
    }
  }

  // Line — cumulative spending
  const byDate = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    const d = (t.date||'').slice(0, 10);
    byDate[d] = (byDate[d] || 0) + t.amount;
  });
  const dates = Object.keys(byDate).sort();
  let cum = 0;
  const cumVals = dates.map(d => { cum += byDate[d]; return cum; });

  const lineCtx = document.getElementById('lineChart')?.getContext('2d');
  if (lineCtx) {
    if (lineChart) {
      lineChart.data.labels = dates;
      lineChart.data.datasets[0].data = cumVals;
      lineChart.update();
    } else {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Cumulative Spending',
            data: cumVals,
            borderColor: '#c9a84c',
            backgroundColor: 'rgba(201,168,76,0.12)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#c9a84c', pointRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, callback: v => currency + v.toLocaleString() }, grid: { color: gridColor }, beginAtZero: true },
          },
        },
      });
    }
  }
}

// ══════════════════════════════════════════════════════════
//  BUDGETS
// ══════════════════════════════════════════════════════════
async function refreshBudgets() {
  try {
    const month = getVal('budgetMonth') || currentMonth();
    const data  = await GET(`/budgets?month=${month}`);
    renderBudgetList(data.budgets);
  } catch (err) {
    toast('Failed to load budgets: ' + err.message, 'error');
  }
}

function renderBudgetList(budgets) {
  const list  = document.getElementById('budgetList');
  const empty = document.getElementById('budgetEmpty');

  if (!budgets || budgets.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = budgets.map(b => {
    const pct = Math.min(b.percentage, 100);
    const cls = pct >= 100 ? 'bar-danger' : pct >= b.alertAt ? 'bar-warn' : 'bar-ok';
    return `
      <div class="budget-item">
        <div class="budget-row">
          <span class="budget-name">${CAT_ICONS[b.category]||''} ${b.category}</span>
          <span style="display:flex;gap:12px;align-items:center">
            <span class="budget-meta">${fmt(b.spent)} / ${fmt(b.limit)}</span>
            <span class="budget-pct" style="color:${pct>=100?'var(--red)':pct>=b.alertAt?'var(--orange)':'var(--green)'}">${Math.round(pct)}%</span>
            <button class="icon-btn delete" onclick="deleteBudget('${b._id}')" title="Remove budget">✕</button>
          </span>
        </div>
        <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

async function setBudget() {
  const category = getVal('budgetCat');
  const limit    = parseFloat(getVal('budgetLimit'));
  const alertAt  = parseInt(getVal('budgetAlert')) || 80;
  const month    = getVal('budgetMonth') || currentMonth();

  if (isNaN(limit) || limit <= 0) { toast('Enter a valid budget amount', 'error'); return; }

  try {
    await PUT('/budgets', { category, limit, alertAt, month });
    toast(`Budget for ${category} saved!`);
    setVal('budgetLimit', '');
    await refreshBudgets();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteBudget(id) {
  const confirmed = await openModal('Remove Budget?', 'This budget limit will be removed.', 'Remove', 'btn-danger');
  if (!confirmed) return;
  try {
    await DELETE('/budgets/' + id);
    toast('Budget removed.', 'info');
    await refreshBudgets();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════
function refreshSettings() {
  if (!user) return;
  setVal('settingsCurrency', user.currency || 'USD');
  setVal('settingsEmail', user.email || '');
  document.getElementById('settingsUsername').textContent = user.username;
}

async function saveSettings() {
  const newCurrency = getVal('settingsCurrency');
  const newEmail    = getVal('settingsEmail');
  try {
    const data = await PATCH('/auth/settings', { currency: newCurrency, email: newEmail });
    user     = data.user;
    currency = CURRENCIES[user.currency] || '$';
    localStorage.setItem('finova_user', JSON.stringify(user));
    toast('Settings saved!');
    refreshDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function changePassword() {
  const cur = getVal('settingsCurPass');
  const nw  = getVal('settingsNewPass');
  const cnf = getVal('settingsConfPass');
  if (!cur || !nw) { toast('Fill in all fields', 'error'); return; }
  if (nw !== cnf)  { toast('Passwords do not match', 'error'); return; }
  if (nw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
  try {
    await PATCH('/auth/password', { currentPassword: cur, newPassword: nw });
    toast('Password changed!');
    clearForm('settingsCurPass', 'settingsNewPass', 'settingsConfPass');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  EXPORT CSV
// ══════════════════════════════════════════════════════════
function exportCSV() {
  if (transactions.length === 0) { toast('No transactions to export', 'info'); return; }
  const rows = [['Date','Name','Category','Type','Amount','Note']];
  transactions.forEach(t => {
    rows.push([(t.date||'').slice(0,10), t.name, t.category, t.type, t.amount.toFixed(2), t.note||'']);
  });
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `finova_${user?.username}_${todayISO()}.csv` });
  a.click();
  toast('CSV exported!');
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Restore session
  if (token && user) {
    try {
      const data = await GET('/auth/me');
      user = data.user;
      localStorage.setItem('finova_user', JSON.stringify(user));
      await bootApp();
    } catch (_) {
      logout();
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal(false);
  });

  // Auth enter key
  document.getElementById('authPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAuth();
  });
});
