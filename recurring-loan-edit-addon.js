(() => {
  'use strict';

  const REC='nudgeRecurringPayments';
  const LOAN='nudgeLoans';
  const TX='nudgeFinanceTransactions';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  const style=document.createElement('style');
  style.textContent=`
    .record-actions .edit-record{background:var(--soft);color:var(--text)}
    .record-actions .delete-record{background:transparent;border-color:#d95b68;color:#d95b68}
    #editRecurringModal .expense-option,#editLoanModal .expense-option{display:flex!important;align-items:center;gap:10px;text-transform:none!important;color:var(--text)!important}
    #editRecurringModal .expense-option input,#editLoanModal .expense-option input{width:auto!important;margin:0!important}
  `;
  document.head.appendChild(style);

  function installModals(){
    if(!document.querySelector('#editRecurringModal')){
      document.body.insertAdjacentHTML('beforeend',`<div id="editRecurringModal" class="modal"><form id="editRecurringForm"><button type="button" class="close">×</button><h2>Edit Recurring Payment</h2><input type="hidden" name="id"><label>Name<input name="name" required></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Category<select name="category"><option>Subscription</option><option>SIP</option><option>Mutual Fund</option><option>Rotating Savings</option><option>Rent</option><option>Family support</option><option>Insurance</option><option>Utility</option><option>Other</option></select></label><label>Frequency<select name="frequency"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="half-yearly">Half-yearly</option><option value="yearly">Yearly</option></select></label><label>Next due<input name="nextDue" type="date" required></label><label class="expense-option"><input type="checkbox" name="addToExpenses"> Add marked payments to expenses</label><button class="primary">Save Changes</button></form></div>`);
    }
    if(!document.querySelector('#editLoanModal')){
      document.body.insertAdjacentHTML('beforeend',`<div id="editLoanModal" class="modal"><form id="editLoanForm"><button type="button" class="close">×</button><h2>Edit Loan EMI</h2><input type="hidden" name="id"><label>Loan name<input name="name" required></label><label>Lender<input name="lender"></label><label>Monthly EMI<input name="emi" type="number" min="0.01" step="0.01" required></label><label>Tenure months<input name="tenure" type="number" min="1" required></label><label>Months paid<input name="paid" type="number" min="0" required></label><label>Next due<input name="nextDue" type="date" required></label><label class="expense-option"><input type="checkbox" name="addToExpenses"> Add marked EMIs to expenses</label><button class="primary">Save Changes</button></form></div>`);
    }
    document.querySelectorAll('#editRecurringModal .close,#editLoanModal .close').forEach(b=>b.onclick=()=>b.closest('.modal').classList.remove('open'));
    document.querySelectorAll('#editRecurringModal,#editLoanModal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('open')});

    document.querySelector('#editRecurringForm').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),all=read(REC),i=all.findIndex(x=>x.id===f.get('id'));if(i<0)return;
      all[i]={...all[i],name:f.get('name'),amount:+f.get('amount'),category:f.get('category'),frequency:f.get('frequency'),nextDue:f.get('nextDue'),addToExpenses:f.get('addToExpenses')==='on'};
      save(REC,all);location.reload();
    };
    document.querySelector('#editLoanForm').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),all=read(LOAN),i=all.findIndex(x=>x.id===f.get('id'));if(i<0)return;
      const tenure=Math.max(1,+f.get('tenure')||1),paid=Math.min(tenure,Math.max(0,+f.get('paid')||0));
      all[i]={...all[i],name:f.get('name'),lender:f.get('lender'),emi:+f.get('emi'),tenure,paid,nextDue:f.get('nextDue'),addToExpenses:f.get('addToExpenses')==='on',status:paid>=tenure?'completed':'active'};
      save(LOAN,all);location.reload();
    };
  }

  function editRecurring(id){const x=read(REC).find(v=>v.id===id);if(!x)return;const f=document.querySelector('#editRecurringForm');f.id.value=x.id;f.name.value=x.name||'';f.amount.value=x.amount||0;f.category.value=x.category||'Other';f.frequency.value=x.frequency||'monthly';f.nextDue.value=x.nextDue||'';f.addToExpenses.checked=x.addToExpenses!==false;document.querySelector('#editRecurringModal').classList.add('open')}
  function editLoan(id){const x=read(LOAN).find(v=>v.id===id);if(!x)return;const f=document.querySelector('#editLoanForm');f.id.value=x.id;f.name.value=x.name||'';f.lender.value=x.lender||'';f.emi.value=x.emi||0;f.tenure.value=x.tenure||1;f.paid.value=x.paid||0;f.nextDue.value=x.nextDue||'';f.addToExpenses.checked=x.addToExpenses!==false;document.querySelector('#editLoanModal').classList.add('open')}

  function linkedExpenses(source,id){return read(TX).filter(x=>x.source===source&&x.sourceId===id)}
  function deleteRecurring(id){const all=read(REC),x=all.find(v=>v.id===id);if(!x)return;const linked=linkedExpenses('recurring',id);const warning=linked.length?`\n\n${linked.length} already-recorded expense${linked.length===1?'':'s'} will remain in Expenses.`:'';if(!confirm(`Delete recurring payment “${x.name}”?${warning}`))return;save(REC,all.filter(v=>v.id!==id));location.reload()}
  function deleteLoan(id){const all=read(LOAN),x=all.find(v=>v.id===id);if(!x)return;const linked=linkedExpenses('loan',id);const warning=linked.length?`\n\n${linked.length} already-recorded EMI expense${linked.length===1?'':'s'} will remain in Expenses.`:'';if(!confirm(`Delete loan “${x.name}”?${warning}`))return;save(LOAN,all.filter(v=>v.id!==id));location.reload()}

  function decorate(){
    const recurring=read(REC),recRows=[...document.querySelectorAll('#rlist .row')];
    recRows.forEach((row,i)=>{const x=recurring[i];if(!x||row.querySelector('[data-edit-recurring]'))return;let actions=row.querySelector('.record-actions');if(!actions){row.classList.add('has-actions');row.innerHTML=`<div class="row-main">${row.innerHTML}</div><div class="record-actions"></div>`;actions=row.querySelector('.record-actions')}actions.insertAdjacentHTML('afterbegin',`<button type="button" class="edit-record" data-edit-recurring="${x.id}">Edit</button><button type="button" class="delete-record" data-delete-recurring="${x.id}">Delete</button>`)});
    const loans=read(LOAN).filter(x=>x.status!=='completed'),loanRows=[...document.querySelectorAll('#llist .row')];
    loanRows.forEach((row,i)=>{const x=loans[i];if(!x||row.querySelector('[data-edit-loan]'))return;let actions=row.querySelector('.record-actions');if(!actions){row.classList.add('has-actions');row.innerHTML=`<div class="row-main">${row.innerHTML}</div><div class="record-actions"></div>`;actions=row.querySelector('.record-actions')}actions.insertAdjacentHTML('afterbegin',`<button type="button" class="edit-record" data-edit-loan="${x.id}">Edit</button><button type="button" class="delete-record" data-delete-loan="${x.id}">Delete</button>`)});
    document.dispatchEvent(new CustomEvent('nudge:records-decorated'));
  }

  document.addEventListener('click',e=>{const er=e.target.closest('[data-edit-recurring]');if(er)editRecurring(er.dataset.editRecurring);const dr=e.target.closest('[data-delete-recurring]');if(dr)deleteRecurring(dr.dataset.deleteRecurring);const el=e.target.closest('[data-edit-loan]');if(el)editLoan(el.dataset.editLoan);const dl=e.target.closest('[data-delete-loan]');if(dl)deleteLoan(dl.dataset.deleteLoan);setTimeout(decorate,0)});
  installModals();decorate();
})();
