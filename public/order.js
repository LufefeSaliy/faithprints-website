// Order Online section — talks to our Express API at /api/services and /api/orders

let services = [];

async function loadServices() {
  const res = await fetch('/api/services');
  services = await res.json();

  // Group by category so the dropdown mirrors the site's own price list layout
  const categories = [...new Set(services.map(s => s.category))];
  const select = document.getElementById('oproduct');

  select.innerHTML = categories.map(cat => {
    const items = services.filter(s => s.category === cat);
    const options = items.map(s => `<option value="${s.id}">${s.name} — R${s.price}</option>`).join('');
    return `<optgroup label="${cat}">${options}</optgroup>`;
  }).join('');

  updateSummary();
}

function getSelectedService() {
  return services.find(s => s.id === document.getElementById('oproduct').value);
}

function updateSummary() {
  const service = getSelectedService();
  if (!service) return;

  const qty = parseInt(document.getElementById('oqty').value) || 1;

  document.getElementById('sumProduct').textContent = service.name;
  document.getElementById('sumUnitPrice').textContent = 'R' + service.price;
  document.getElementById('sumQty').textContent = qty;
  document.getElementById('sumTotal').textContent = 'R' + (service.price * qty);
}

async function placeOrder(e) {
  e.preventDefault();

  const btn = document.getElementById('orderSubmitBtn');
  const service = getSelectedService();
  const customer = document.getElementById('oname').value;
  const contact = document.getElementById('ocontact').value;
  const quantity = parseInt(document.getElementById('oqty').value) || 1;
  const notes = document.getElementById('onotes').value;
  const box = document.getElementById('orderConfirm');

  if (!service) return;

  btn.disabled = true;
  btn.textContent = 'Placing order...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, contact, serviceId: service.id, quantity, notes })
    });

    const data = await res.json();

    if (!res.ok) {
      box.className = 'confirm-box error';
      box.style.display = 'block';
      box.innerHTML = '<strong>Could not place order.</strong><br>' + data.error;
      return;
    }

    box.className = 'confirm-box';
    box.style.display = 'block';
    box.innerHTML = `<strong>Order received — thank you, ${data.customer}.</strong><br>${data.service} × ${data.quantity} — R${data.total}. We'll be in touch to confirm details.`;

    document.getElementById('orderForm').reset();
    document.getElementById('oqty').value = 1;
    updateSummary();

  } catch (err) {
    box.className = 'confirm-box error';
    box.style.display = 'block';
    box.innerHTML = '<strong>Connection error.</strong><br>Please try again, or order via WhatsApp instead using the link below.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place order';
  }
}

document.getElementById('oproduct').addEventListener('change', updateSummary);
document.getElementById('oqty').addEventListener('change', updateSummary);
document.getElementById('orderForm').addEventListener('submit', placeOrder);

loadServices();
