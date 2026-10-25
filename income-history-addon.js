(() => {
  'use strict';

  const TX_KEY = 'nudgeFinanceTransactions';
  const read = () => {
    try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; }
    catch { return []; }
  };
  const save = value => localStorage.setItem(TX_KEY, JSON.stringify(value));
  const money = value => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  }).format(Number(value) || 0);
  const dateText = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const esc = value => String(value || '').replace(/[&<>\"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[char]));

  const incomeCategories = ['Salary','Refund','Gift','Bonus','Interest','Other Income'];
  const transferCategories = ['Account Transfer','Bank Transfer','Wallet Transfer','Other Transfer'];

  const style = document.createElement('style');
  style.textContent = `
    .income-history-section{margin-top:22px;margin-bottom:86px}
    .income-history-heading{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px}
    .income-history-heading h2{margin:0;font-size:20px}
    .income-history-heading small{color:var(--muted)}
    #incomeHistory .row{display:block}
    #incomeHistory .row-main{display:flex;justify-content:space-between;gap:12px;align-items:center}
    #incomeHistory .income-amount{color:var(--green)}
    #incomeHistory .transfer-amount{color:var(--muted)}
    #incomeHistory .record-actions{display:flex;gap:7px;justify-content:flex-end;margin-top:9px}
    #incomeHistory .record-actions button{border:1px solid var(--line);border-radius:9px;padding:7px 10px;background:var(--soft);color:var(--text);font-weight:700;font-size:12px}
    #incomeHistory .record-actions .delete-history{background:transparent;border-color:#d95b68;color:#d95b68}
  `;
  document.head.appendChild(style);

  function selectedMonthKey() {
    const text = document.querySelector('#tm')?.textContent?.trim();
    const parsed = new Date(`1 ${text || ''} 12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }

  function installSection() {
    const transactionsPage = document.querySelector('#transactions');
    const expenseList = document.querySelector('#txlist');
    if (!transactionsPage || !expenseList || document.querySelector('#incomeHistorySection')) return;

    expenseList.insertAdjacentHTML('afterend', `
      <section id="incomeHistorySection" class="income-history-section">
        <div class="income-history-heading">
          <h2>Income & Transfers</h2>
          <small id="incomeHistoryCount"></small>
        </div>
        <div id="incomeHistory" class="list"></div>
      </section>`);
  }

  function renderHistory() {
    installSection();
    const key = selectedMonthKey();
    const records = read()
      .filter(item => ['income','transfer'].includes(String(item.type || '').toLowerCase()))
      .filter(item => String(item.date || '').slice(0, 7) === key)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const list = document.querySelector('#incomeHistory');
    const count = document.querySelector('#incomeHistoryCount');
    if (!list || !count) return;

    count.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
    list.innerHTML = records.length ? records.map(item => {
      const type = String(item.type).toLowerCase();
      return `<article class="row has-actions">
        <div class="row-main">
          <div><h3>${esc(item.description || item.category || type)}</h3><p>${esc(item.category || type)} · ${dateText(item.date)}</p></div>
          <b class="${type === 'income' ? 'income-amount' : 'transfer-amount'}">${money(item.amount)}</b>
        </div>
        <div class="record-actions">
          <button type="button" data-edit-history="${item.id}">Edit</button>
          <button type="button" class="delete-history" data-delete-history="${item.id}">Delete</button>
        </div>
      </article>`;
    }).join('') : '<div class="empty">No income or transfers this month</div>';

    document.dispatchEvent(new CustomEvent('nudge:records-decorated'));
  }

  function installModal() {
    if (document.querySelector('#editHistoryModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="editHistoryModal" class="modal">
        <form id="editHistoryForm">
          <button type="button" class="close">×</button>
          <h2>Edit Transaction</h2>
          <input type="hidden" name="id">
          <input type="hidden" name="type">
          <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label>
          <label>Category<select name="category" required></select></label>
          <label>Description<input name="description"></label>
          <label>Date<input name="date" type="date" required></label>
          <label>Payment method<select name="paymentMethod"><option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option><option>Auto Debit</option></select></label>
          <button class="primary">Save Changes</button>
        </form>
      </div>`);

    const modal = document.querySelector('#editHistoryModal');
    modal.querySelector('.close').onclick = () => modal.classList.remove('open');
    modal.onclick = event => { if (event.target === modal) modal.classList.remove('open'); };
    modal.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const form = new FormData(event.target);
      const all = read();
      const index = all.findIndex(item => item.id === form.get('id'));
      if (index < 0) return;
      all[index] = {
        ...all[index],
        amount: Number(form.get('amount')),
        category: form.get('category'),
        description: form.get('description'),
        date: form.get('date'),
        paymentMethod: form.get('paymentMethod')
      };
      save(all);
      modal.classList.remove('open');
      location.reload();
    };
  }

  function editRecord(id) {
    const item = read().find(record => record.id === id);
    if (!item) return;
    const form = document.querySelector('#editHistoryForm');
    const categories = item.type === 'income' ? incomeCategories : transferCategories;
    form.id.value = item.id;
    form.type.value = item.type;
    form.amount.value = item.amount || 0;
    form.category.innerHTML = categories.map(value => `<option value="${value}">${value}</option>`).join('');
    form.category.value = item.category || categories[0];
    form.description.value = item.description || '';
    form.date.value = item.date || '';
    form.paymentMethod.value = item.paymentMethod || 'Bank Transfer';
    document.querySelector('#editHistoryModal').classList.add('open');
  }

  function deleteRecord(id) {
    const all = read();
    const item = all.find(record => record.id === id);
    if (!item) return;
    const label = item.description || item.category || item.type;
    if (!confirm(`Delete ${label} (${money(item.amount)})? This cannot be undone.`)) return;
    save(all.filter(record => record.id !== id));
    location.reload();
  }

  document.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-history]');
    if (edit) editRecord(edit.dataset.editHistory);
    const remove = event.target.closest('[data-delete-history]');
    if (remove) deleteRecord(remove.dataset.deleteHistory);
    if (event.target.closest('#tp,#tn,[data-page="transactions"]')) setTimeout(renderHistory, 0);
  });

  const monthLabel = document.querySelector('#tm');
  if (monthLabel) new MutationObserver(() => requestAnimationFrame(renderHistory))
    .observe(monthLabel, { childList: true, characterData: true, subtree: true });

  installSection();
  installModal();
  renderHistory();
})();
