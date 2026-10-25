(() => {
  'use strict';

  const TX_KEY = 'nudgeFinanceTransactions';
  const readTransactions = () => {
    try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; }
    catch { return []; }
  };

  const amountOf = transaction => {
    if (Number.isFinite(Number(transaction.amount))) return Number(transaction.amount);
    if (Number.isFinite(Number(transaction.amountPaise))) return Number(transaction.amountPaise) / 100;
    return 0;
  };

  const money = value => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);

  function selectedMonthStart() {
    const label = document.querySelector('#dm')?.textContent?.trim();
    if (!label) return null;
    const parsed = new Date(`1 ${label} 12:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1, 12, 0, 0);
  }

  function transactionDate(transaction) {
    const parsed = new Date(`${transaction.date || ''}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function calculate(monthStart) {
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1, 12, 0, 0);
    let opening = 0;
    let income = 0;
    let expenses = 0;

    readTransactions().forEach(transaction => {
      const date = transactionDate(transaction);
      if (!date) return;
      const type = String(transaction.type || 'expense').toLowerCase();
      const amount = amountOf(transaction);

      // Transfers move money between the user's own accounts and must not affect balance.
      if (type === 'transfer') return;

      if (date < monthStart) {
        if (type === 'income') opening += amount;
        if (type === 'expense') opening -= amount;
        return;
      }

      if (date >= monthStart && date < nextMonth) {
        if (type === 'income') income += amount;
        if (type === 'expense') expenses += amount;
      }
    });

    return { opening, income, expenses, available: opening + income - expenses };
  }

  function installCard() {
    const dashboard = document.querySelector('#dashboard');
    const totals = dashboard?.querySelector('.totals');
    if (!dashboard || !totals || dashboard.querySelector('#openingBalanceCard')) return;

    const card = document.createElement('div');
    card.id = 'openingBalanceCard';
    card.className = 'opening-balance-card summary';
    card.innerHTML = '<span>Opening balance</span><b id="openingBalance">₹0</b><small>Carried forward from previous months</small>';
    totals.parentNode.insertBefore(card, totals);
  }

  function renderOpeningBalance() {
    installCard();
    const monthStart = selectedMonthStart();
    if (!monthStart) return;

    const values = calculate(monthStart);
    const opening = document.querySelector('#openingBalance');
    const available = document.querySelector('#db');
    if (opening) opening.textContent = money(values.opening);
    if (available) available.textContent = money(values.available);

    // Ask the existing privacy add-on to re-mask newly updated monetary values.
    document.dispatchEvent(new CustomEvent('nudge:records-decorated'));
  }

  const style = document.createElement('style');
  style.textContent = `
    .opening-balance-card{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:15px 18px;
      margin:0 0 12px;
      border-radius:18px;
      background:var(--soft);
      border:1px solid var(--line);
      color:var(--text);
    }
    .opening-balance-card span,
    .opening-balance-card b,
    .opening-balance-card small{display:block;margin:0}
    .opening-balance-card span{font-weight:800}
    .opening-balance-card b{font-size:20px;white-space:nowrap}
    .opening-balance-card small{color:var(--muted);font-size:12px;text-align:right;max-width:145px}
    @media(max-width:390px){
      .opening-balance-card{display:grid;grid-template-columns:1fr auto;padding:14px}
      .opening-balance-card small{grid-column:1/-1;text-align:left;max-width:none}
      .opening-balance-card b{font-size:18px}
    }
  `;
  document.head.appendChild(style);

  document.querySelector('#dp')?.addEventListener('click', () => setTimeout(renderOpeningBalance, 0));
  document.querySelector('#dn')?.addEventListener('click', () => setTimeout(renderOpeningBalance, 0));
  document.querySelector('[data-page="dashboard"]')?.addEventListener('click', () => setTimeout(renderOpeningBalance, 0));
  document.addEventListener('nudge:balance-refresh', renderOpeningBalance);

  const monthLabel = document.querySelector('#dm');
  if (monthLabel) {
    new MutationObserver(() => requestAnimationFrame(renderOpeningBalance))
      .observe(monthLabel, { childList: true, characterData: true, subtree: true });
  }

  requestAnimationFrame(renderOpeningBalance);
})();
