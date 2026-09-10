// Faith Prints — Full Stack Server
// Node.js + Express + a JSON file as the database.
// Serves the real Faith Prints website and powers its "Order Online" section + admin dashboard.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'orders.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers to read/write our "database" file ---
function readOrders() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return raw ? JSON.parse(raw) : [];
}

function writeOrders(orders) {
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
}

// --- Real price list, matching the official price list on the website ---
const SERVICES = [
  // Merchandise
  { id: 'merch-ls-tee', name: 'Long Sleeve T-Shirt', category: 'Merchandise', price: 320 },
  { id: 'merch-ss-tee', name: 'Short Sleeve T-Shirt', category: 'Merchandise', price: 285 },
  { id: 'merch-crew', name: 'Crew Neck', category: 'Merchandise', price: 290 },
  { id: 'merch-golf', name: 'Golf Shirt', category: 'Merchandise', price: 300 },
  { id: 'merch-hoodie', name: 'Hoodie', category: 'Merchandise', price: 410 },
  { id: 'merch-shorts', name: 'Shorts', category: 'Merchandise', price: 350 },
  { id: 'merch-track-pants', name: 'Track Pants', category: 'Merchandise', price: 390 },

  // Heat Press — Client Design
  { id: 'press-client-a4', name: 'Heat Press A4 (client design)', category: 'Heat Press — Client Design', price: 70 },
  { id: 'press-client-a3', name: 'Heat Press A3 (client design)', category: 'Heat Press — Client Design', price: 95 },
  { id: 'press-client-a5', name: 'Heat Press A5 (client design)', category: 'Heat Press — Client Design', price: 45 },
  { id: 'press-client-pocket', name: 'Heat Press Pocket Size (client design)', category: 'Heat Press — Client Design', price: 25 },

  // Heat Press — Your Design & Apparel
  { id: 'press-own-pocket', name: 'Heat Press Pocket Size (your design & apparel)', category: 'Heat Press — Your Design & Apparel', price: 20 },
  { id: 'press-own-a5', name: 'Heat Press A5 (your design & apparel)', category: 'Heat Press — Your Design & Apparel', price: 30 },
  { id: 'press-own-a4', name: 'Heat Press A4 (your design & apparel)', category: 'Heat Press — Your Design & Apparel', price: 35 },
  { id: 'press-own-a3', name: 'Heat Press A3 (your design & apparel)', category: 'Heat Press — Your Design & Apparel', price: 40 },

  // DTF Transfer Printing
  { id: 'dtf-roll', name: 'DTF Transfer — 20cm x 1m Roll', category: 'DTF Transfer Printing', price: 150 },
  { id: 'dtf-a3', name: 'DTF Transfer — A3', category: 'DTF Transfer Printing', price: 80 },
  { id: 'dtf-a4', name: 'DTF Transfer — A4', category: 'DTF Transfer Printing', price: 65 },

  // Design
  { id: 'design-logo', name: 'Logo Design', category: 'Design', price: 80 },
  { id: 'design-art', name: 'Art Design', category: 'Design', price: 100 },

  // Blank Apparel
  { id: 'blank-tee-300', name: 'T-Shirt 300gsm (blank)', category: 'Blank Apparel', price: 160 },
  { id: 'blank-tee-220', name: 'T-Shirt 220gsm (blank)', category: 'Blank Apparel', price: 90 },
  { id: 'blank-ls-tee', name: 'Long Sleeve Tee (blank)', category: 'Blank Apparel', price: 70 },
  { id: 'blank-hoodie-h', name: 'Hoodie (H) (blank)', category: 'Blank Apparel', price: 250 },
  { id: 'blank-hoodie-s', name: 'Hoodie (S) (blank)', category: 'Blank Apparel', price: 230 },

  // Other Garments
  { id: 'other-golf', name: 'Golf Shirt (blank)', category: 'Other Garments', price: 85 },
  { id: 'other-crew', name: 'Crew Neck (blank)', category: 'Other Garments', price: 50 },
  { id: 'other-tracksuit', name: 'Tracksuit (blank)', category: 'Other Garments', price: 340 },
  { id: 'other-shorts', name: 'Shorts, Big/Track (blank)', category: 'Other Garments', price: 220 }
];

// --- API routes ---

// Get the full service/price list (grouped by category on the frontend)
app.get('/api/services', (req, res) => {
  res.json(SERVICES);
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

// Place a new order
app.post('/api/orders', (req, res) => {
  const { customer, contact, serviceId, quantity, notes } = req.body;

  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: 'Please select a valid product or service.' });
  }
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' });
  }

  const orders = readOrders();
  const newOrder = {
    id: Date.now(),
    customer: customer && customer.trim() ? customer.trim() : 'Walk-in customer',
    contact: contact && contact.trim() ? contact.trim() : '—',
    service: service.name,
    category: service.category,
    unitPrice: service.price,
    quantity,
    notes: notes && notes.trim() ? notes.trim() : '—',
    total: service.price * quantity,
    status: 'queued',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// Update an order's status
app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['queued', 'printing', 'quality_check', 'ready', 'collected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const orders = readOrders();
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = status;
  writeOrders(orders);
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Faith Prints server running at http://localhost:${PORT}`);
});
