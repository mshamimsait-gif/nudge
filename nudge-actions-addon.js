(() => {
  'use strict';
  const TX='nudgeFinanceTransactions', REC='nudgeRecurringPayments', LOAN='nudgeLoans';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const today=()=>new Date().toISOString().slice(0,10);
  const monthKey=d=>String(d||'').slice(0,7);
  const currentMonth=()=>today().slice(0,7);
  const addMonths=(value,count=1)=>{const d=new Date((value||today())+'T12:00:00');const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+count);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return d.toISOString().slice(0,10)};
  const subtractMonths=(value,count=1)=>addMonths(value,-count);
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(+n||0);

  const style=document.createElement('style');
  style.textContent=`
    .record-actions{display:flex;gap:7px;justify-content:flex-end;margin-top:9px}
    .record-actions button{border:1px solid var(--line);border-radius:9px;padding:7px 10px;background:var(--soft);color:var(--text);font-weight:700;font-size:12px}
    .record-actions .paid{background:var(--blue);border-color:var(--blue);color:#fff}
    .record-actions .delete-expense{background:transparent;border-color:#d95b68;color:#d95b68}
    .switch.three-way{grid-template-columns:repeat(3,1fr)}
    .row.has-actions{display:block}.row-main{display:flex;justify-content:space-between;gap:12px}.row-main>b{text-align:right}
    .expense-option{display:flex!important;align-items:center;gap:10px;text-transform:none!important;letter-spacing:0!important;color:var(--text)!important}
    .expense-option input{width:auto!important;margin:0!important}
    #editTxModal .edit-grid{display:grid;gap:0}
  `;
  document.head.appendChild(style);


  function addTransferOption(){
    const switcher=document.querySelector('#txform .switch');
    if(!switcher||switcher.querySelector('[data-type="transfer"]'))return;
    switcher.insertAdjacentHTML('beforeend','<button type="button" data-type="transfer">Transfer</button>');
    switcher.classList.add('three-way');
    const transferButton=switcher.querySelector('[data-type="transfer"]');
    transferButton.addEventListener('click',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      switcher.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      transferButton.classList.add('active');
      const form=document.querySelector('#txform');
      form.querySelector('[name="type"]').value='transfer';
      const category=form.querySelector('[name="category"]');
      category.innerHTML='<option value="Account Transfer">Self Account Transfer</option><option value="Bank Transfer">Bank to Bank Transfer</option><option value="Wallet Transfer">Wallet Transfer</option><option value="Other Transfer">Other Transfer</option>';
      const description=form.querySelector('[name="description"]');
      if(!description.value)description.value='Self transfer';
    },true);
  }

  function addOptions(){
    const rf=document.querySelector('#rform'), lf=document.querySelector('#lform');
    if(rf&&!rf.querySelector('[name=addToExpenses]')) rf.querySelector('.primary').insertAdjacentHTML('beforebegin','<label class="expense-option"><input type="checkbox" name="addToExpenses" checked> Add marked payments to expenses</label>');
    if(lf&&!lf.querySelector('[name=addToExpenses]')) lf.querySelector('.primary').insertAdjacentHTML('beforebegin','<label class="expense-option"><input type="checkbox" name="addToExpenses" checked> Add marked EMIs to expenses</label>');
  }

  function addEditModal(){
    if(document.querySelector('#editTxModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="editTxModal" class="modal"><form id="editTxForm"><button type="button" class="close">×</button><h2>Edit Expense</h2><input type="hidden" name="id"><div class="edit-grid"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Category<select name="category"><option>Food</option><option>Zomato / Swiggy</option><option>Blinkit / Zepto</option><option>Grocery</option><option>Transport</option><option>Fuel</option><option>Housing</option><option>Utilities</option><option>Shopping</option><option>Health</option><option>Family</option><option>Loan/EMI</option><option>Other</option></select></label><label>Description<input name="description"></label><label>Date<input name="date" type="date" required></label><label>Payment method<select name="paymentMethod"><option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option><option>Auto Debit</option></select></label></div><button class="primary">Save Changes</button></form></div>`);
    const modal=document.querySelector('#editTxModal');
    modal.querySelector('.close').onclick=()=>modal.classList.remove('open');
    modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
    modal.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target), all=read(TX), i=all.findIndex(x=>x.id===f.get('id'));if(i<0)return;all[i]={...all[i],amount:+f.get('amount'),category:f.get('category'),description:f.get('description'),date:f.get('date'),paymentMethod:f.get('paymentMethod')};save(TX,all);modal.classList.remove('open');location.reload()};
  }

  function editExpense(id){const x=read(TX).find(t=>t.id===id);if(!x)return;const f=document.querySelector('#editTxForm');f.id.value=x.id;f.amount.value=x.amount;f.category.value=x.category;f.description.value=x.description||'';f.date.value=x.date;f.paymentMethod.value=x.paymentMethod||'UPI';document.querySelector('#editTxModal').classList.add('open')}

  function markRecurring(id){const all=read(REC),i=all.findIndex(x=>x.id===id);if(i<0)return;const x=all[i];if(x.lastPaidMonth===currentMonth()){alert('This recurring payment is already marked paid for the current month.');return}if(!confirm(`Mark ${x.name} (${money(x.amount)}) paid for this month?`))return;x.lastPaid=today();x.lastPaidMonth=currentMonth();const span={monthly:1,quarterly:3,'half-yearly':6,yearly:12}[x.frequency]||1;x.nextDue=addMonths(x.nextDue,span);all[i]=x;save(REC,all);if(x.addToExpenses!==false){const tx=read(TX);tx.push({id:crypto.randomUUID(),type:'expense',amount:+x.amount||0,category:x.category||'Other',description:x.name,date:today(),paymentMethod:x.payment||x.paymentMethod||'Auto Debit',source:'recurring',sourceId:x.id,paidMonth:currentMonth()});save(TX,tx)}location.reload()}

  function markLoan(id){const all=read(LOAN),i=all.findIndex(x=>x.id===id);if(i<0)return;const x=all[i];if(x.lastPaidMonth===currentMonth()){alert('This EMI is already marked paid for the current month.');return}if(!confirm(`Mark ${x.name} EMI (${money(x.emi)}) paid for this month?`))return;x.paid=Math.min(+x.tenure||0,(+x.paid||0)+1);x.lastPaid=today();x.lastPaidMonth=currentMonth();x.nextDue=addMonths(x.nextDue,1);if(x.paid>=x.tenure)x.status='completed';all[i]=x;save(LOAN,all);if(x.addToExpenses!==false){const tx=read(TX);tx.push({id:crypto.randomUUID(),type:'expense',amount:+x.emi||0,category:'Loan/EMI',description:`${x.name} EMI`,date:today(),paymentMethod:x.paymentMethod||'Auto Debit',source:'loan',sourceId:x.id,paidMonth:currentMonth()});save(TX,tx)}location.reload()}

  function deleteExpense(id){
    const all=read(TX), expense=all.find(x=>x.id===id);
    if(!expense)return;
    const label=expense.description||expense.category||'this expense';
    const linked=expense.source==='recurring'||expense.source==='loan';
    const message=linked
      ? `Delete ${label} (${money(expense.amount)}) and mark the linked ${expense.source==='loan'?'EMI':'recurring payment'} as unpaid for this month?`
      : `Delete ${label} (${money(expense.amount)})? This cannot be undone.`;
    if(!confirm(message))return;

    save(TX,all.filter(x=>x.id!==id));

    if(expense.source==='recurring'&&expense.sourceId){
      const recurring=read(REC),i=recurring.findIndex(x=>x.id===expense.sourceId);
      if(i>=0){
        const item=recurring[i];
        if(item.lastPaidMonth===expense.paidMonth||item.lastPaidMonth===currentMonth()){
          const span={monthly:1,quarterly:3,'half-yearly':6,yearly:12}[item.frequency]||1;
          item.nextDue=subtractMonths(item.nextDue,span);
          delete item.lastPaid;
          delete item.lastPaidMonth;
          recurring[i]=item;
          save(REC,recurring);
        }
      }
    }

    if(expense.source==='loan'&&expense.sourceId){
      const loans=read(LOAN),i=loans.findIndex(x=>x.id===expense.sourceId);
      if(i>=0){
        const loan=loans[i];
        if(loan.lastPaidMonth===expense.paidMonth||loan.lastPaidMonth===currentMonth()){
          loan.paid=Math.max(0,(+loan.paid||0)-1);
          loan.nextDue=subtractMonths(loan.nextDue,1);
          loan.status='active';
          delete loan.lastPaid;
          delete loan.lastPaidMonth;
          loans[i]=loan;
          save(LOAN,loans);
        }
      }
    }

    location.reload();
  }

  function decorate(){
    const txRows=[...document.querySelectorAll('#txlist .row')];
    const dateLabel=document.querySelector('#tm')?.textContent||'';const parsed=new Date('1 '+dateLabel);const key=isNaN(parsed)?currentMonth():`${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}`;
    const expenses=read(TX).filter(x=>(x.type||'expense')==='expense'&&monthKey(x.date)===key).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    txRows.forEach((row,i)=>{if(row.dataset.actions||!expenses[i])return;row.dataset.actions='1';row.classList.add('has-actions');row.innerHTML=`<div class="row-main">${row.innerHTML}</div><div class="record-actions"><button type="button" data-edit-expense="${expenses[i].id}">Edit</button><button type="button" class="delete-expense" data-delete-expense="${expenses[i].id}">Delete</button></div>`});
    const recRows=[...document.querySelectorAll('#rlist .row')], rec=read(REC);recRows.forEach((row,i)=>{if(row.dataset.actions||!rec[i])return;row.dataset.actions='1';row.classList.add('has-actions');const done=rec[i].lastPaidMonth===currentMonth();row.innerHTML=`<div class="row-main">${row.innerHTML}</div><div class="record-actions"><button type="button" class="paid" data-paid-rec="${rec[i].id}" ${done?'disabled':''}>${done?'Paid this month':'Mark Paid'}</button></div>`});
    const loanRows=[...document.querySelectorAll('#llist .row')], loans=read(LOAN).filter(x=>x.status!=='completed');loanRows.forEach((row,i)=>{if(row.dataset.actions||!loans[i])return;row.dataset.actions='1';row.classList.add('has-actions');const done=loans[i].lastPaidMonth===currentMonth();row.innerHTML=`<div class="row-main">${row.innerHTML}</div><div class="record-actions"><button type="button" class="paid" data-paid-loan="${loans[i].id}" ${done?'disabled':''}>${done?'Paid this month':'Mark Paid'}</button></div>`});
  }

  document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-expense]');if(edit)editExpense(edit.dataset.editExpense);const del=e.target.closest('[data-delete-expense]');if(del)deleteExpense(del.dataset.deleteExpense);const rec=e.target.closest('[data-paid-rec]');if(rec)markRecurring(rec.dataset.paidRec);const loan=e.target.closest('[data-paid-loan]');if(loan)markLoan(loan.dataset.paidLoan);setTimeout(decorate,0)});

  // Persist add-to-expense choices after the existing form handlers save records.
  document.querySelector('#rform')?.addEventListener('submit',e=>{const checked=e.target.querySelector('[name=addToExpenses]')?.checked!==false;setTimeout(()=>{const all=read(REC);if(all.length){all[all.length-1].addToExpenses=checked;save(REC,all)}},0)});
  document.querySelector('#lform')?.addEventListener('submit',e=>{const checked=e.target.querySelector('[name=addToExpenses]')?.checked!==false;setTimeout(()=>{const all=read(LOAN);if(all.length){all[all.length-1].addToExpenses=checked;save(LOAN,all)}},0)});
  addTransferOption();addOptions();addEditModal();decorate();
})();
