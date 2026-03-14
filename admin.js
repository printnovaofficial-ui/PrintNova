const STORAGE_KEYS = {
  orders: "printnova-orders",
  settings: "printnova-settings",
};

const DEFAULT_SETTINGS = {
  colors: ["Arctic White", "Graphite Black", "Signal Red", "Ocean Blue", "Forest Green"],
};

const colorsField = document.querySelector("#admin-colors");
const settingsForm = document.querySelector("#settings-form");
const settingsStatus = document.querySelector("#settings-status");
const ordersList = document.querySelector("#orders-list");
const summaryTotal = document.querySelector("#summary-total");
const summaryPending = document.querySelector("#summary-pending");
const summaryAccepted = document.querySelector("#summary-accepted");
const summaryRejected = document.querySelector("#summary-rejected");

const safeReadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getSettings = () => {
  const stored = safeReadJson(STORAGE_KEYS.settings, null);
  const settings = stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
  if (!Array.isArray(settings.colors) || settings.colors.length === 0) {
    settings.colors = [...DEFAULT_SETTINGS.colors];
  }
  return settings;
};

const getOrders = () => safeReadJson(STORAGE_KEYS.orders, []);

const formatCurrency = (value) => `₹${Math.round(value)}`;
const formatDate = (date) => new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const renderSettings = () => {
  colorsField.value = getSettings().colors.join("\n");
};

const renderSummary = () => {
  const orders = getOrders();
  summaryTotal.textContent = String(orders.length);
  summaryPending.textContent = String(orders.filter((order) => order.status === "Pending Review").length);
  summaryAccepted.textContent = String(orders.filter((order) => order.status === "Accepted").length);
  summaryRejected.textContent = String(orders.filter((order) => order.status === "Rejected").length);
};

const buildOrderCard = (order) => {
  const card = document.createElement("article");
  card.className = "price-card admin-order-card";
  card.innerHTML = `
    <div class="admin-order-head">
      <div>
        <span class="price-label">${order.id}</span>
        <h3>${order.customer.name}</h3>
      </div>
      <strong class="admin-order-status">${order.status}</strong>
    </div>
    <div class="admin-order-grid">
      <div><span>Created</span><strong>${formatDate(order.createdAt)}</strong></div>
      <div><span>Phone</span><strong>${order.customer.phone}</strong></div>
      <div><span>Email</span><strong>${order.customer.email}</strong></div>
      <div><span>Material / Color</span><strong>${order.settings.material} / ${order.settings.color}</strong></div>
      <div><span>Weight</span><strong>${Math.round(order.estimate.weight)} g</strong></div>
      <div><span>Total</span><strong>${formatCurrency(order.estimate.total)}</strong></div>
      <div><span>Print time</span><strong>${order.estimate.printHours.toFixed(1)} hrs</strong></div>
      <div><span>Delivery</span><strong>${order.estimate.delivery}</strong></div>
      <div class="admin-order-span"><span>Address</span><strong>${order.customer.address}</strong></div>
      <div class="admin-order-span"><span>Notes</span><strong>${order.customer.notes || "No extra notes"}</strong></div>
      <div class="admin-order-span"><span>File</span><strong>${order.file ? `${order.file.name} (${order.file.source})` : "No file uploaded"}</strong></div>
      <div class="admin-order-span"><span>System note</span><strong>${order.disclaimer || order.file?.note || order.estimate.weightSource}</strong></div>
    </div>
    <div class="admin-order-actions">
      <button class="button button-primary" data-id="${order.id}" data-status="Accepted" type="button">Accept</button>
      <button class="button button-secondary" data-id="${order.id}" data-status="Rejected" type="button">Reject</button>
      <button class="button button-secondary" data-id="${order.id}" data-status="In Production" type="button">Mark In Production</button>
      <button class="button button-secondary" data-id="${order.id}" data-status="Delivered" type="button">Mark Delivered</button>
    </div>
  `;
  return card;
};

const renderOrders = () => {
  const orders = getOrders();
  ordersList.innerHTML = "";

  if (orders.length === 0) {
    ordersList.innerHTML = '<div class="price-card admin-empty">No orders yet. Submit one from the public site first.</div>';
    return;
  }

  orders.forEach((order) => {
    ordersList.appendChild(buildOrderCard(order));
  });
};

const updateOrderStatus = (id, status) => {
  const orders = getOrders().map((order) => (order.id === id ? { ...order, status } : order));
  writeJson(STORAGE_KEYS.orders, orders);
  renderSummary();
  renderOrders();
};

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const colors = colorsField.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  writeJson(STORAGE_KEYS.settings, { colors: colors.length ? colors : DEFAULT_SETTINGS.colors });
  settingsStatus.textContent = "Available colors updated.";
});

ordersList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id][data-status]");
  if (!button) {
    return;
  }
  updateOrderStatus(button.dataset.id, button.dataset.status);
});

window.addEventListener("storage", () => {
  renderSettings();
  renderSummary();
  renderOrders();
});

if (!safeReadJson(STORAGE_KEYS.settings, null)) {
  writeJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

document.querySelectorAll(".reveal").forEach((item) => {
  item.classList.add("is-visible");
});

renderSettings();
renderSummary();
renderOrders();
