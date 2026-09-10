// Admin dashboard logic — talks to our Express API at /api/orders

async function loadOrders() {
  const res = await fetch('/api/orders');
  const orders = await res.json();
  renderOrders(orders.slice().reverse()); // newest first
}

function renderOrders(orders) {
  const body = document.getElementById('orders-body');
  const table = document.getElementById('orders-table');
  const tableCard = document.querySelector('.table-card');
  const empty = document.getElementById('empty-state');

  if (orders.length === 0) {
    tableCard.style.display = 'none';
    empty.style.display = 'block';
  } else {
    tableCard.style.display = 'block';
    empty.style.display = 'none';
  }

  body.innerHTML = orders.map(o => `
    <tr>
      <td>${o.customer}</td>
      <td>${o.contact || '—'}</td>
      <td>${o.service}</td>
      <td>${o.quantity}</td>
      <td class="notes">${o.notes}</td>
      <td class="total">R${o.total}</td>
      <td>
        <select class="status-select" data-id="${o.id}">
          <option value="queued" ${o.status === 'queued' ? 'selected' : ''}>Queued</option>
          <option value="printing" ${o.status === 'printing' ? 'selected' : ''}>Printing</option>
          <option value="quality_check" ${o.status === 'quality_check' ? 'selected' : ''}>Quality check</option>
          <option value="ready" ${o.status === 'ready' ? 'selected' : ''}>Ready</option>
          <option value="collected" ${o.status === 'collected' ? 'selected' : ''}>Collected</option>
        </select>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', (e) => updateStatus(e.target.dataset.id, e.target.value));
  });

  document.getElementById('stat-total').textContent = orders.length;
  document.getElementById('stat-queued').textContent = orders.filter(o => o.status === 'queued').length;
  document.getElementById('stat-ready').textContent = orders.filter(o => o.status === 'ready').length;
  document.getElementById('stat-revenue').textContent = 'R' + orders.reduce((sum, o) => sum + o.total, 0);
}

async function updateStatus(id, status) {
  await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadOrders();
}

loadOrders();
setInterval(loadOrders, 10000); // auto-refresh so new orders show up without a manual reload
