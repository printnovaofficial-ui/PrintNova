const STORAGE_KEYS = {
  settings: "printnova-settings-v2",
  gallery: "printnova-gallery-v2",
  orders: "printnova-orders-v2",
  auth: "printnova-admin-auth-v1",
};

const DEFAULT_PASSWORD = "printnova-admin";

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

const loginSection = document.querySelector("#login-section");
const adminSection = document.querySelector("#admin-section");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const settingsForm = document.querySelector("#settings-form");
const galleryForm = document.querySelector("#gallery-form");
const settingsStatus = document.querySelector("#settings-status");
const galleryStatus = document.querySelector("#gallery-status");
const adminGalleryGrid = document.querySelector("#admin-gallery-grid");
const orderList = document.querySelector("#order-list");
const logoutButton = document.querySelector("#logout-button");

const defaultSettings = {
  colors: ["Red", "White", "Black", "Gray"],
  materials: ["PLA"],
  pricing: {
    plaPerGram: 5,
    filamentCost: 1000,
    laborPerGram: 1.91,
    shippingNote: "Depends on location in Delhi NCR",
  },
};

const ensureState = () => {
  if (!safeReadJson(STORAGE_KEYS.settings, null)) {
    writeJson(STORAGE_KEYS.settings, defaultSettings);
  }
  if (!safeReadJson(STORAGE_KEYS.gallery, null)) {
    writeJson(STORAGE_KEYS.gallery, []);
  }
};

const getSettings = () => {
  const stored = safeReadJson(STORAGE_KEYS.settings, defaultSettings);
  const settings = {
    ...defaultSettings,
    ...stored,
    pricing: { ...defaultSettings.pricing, ...stored.pricing },
  };

  if (!Array.isArray(settings.colors) || settings.colors.length === 0) {
    settings.colors = [...defaultSettings.colors];
  }

  if (!Array.isArray(settings.materials) || settings.materials.length === 0) {
    settings.materials = [...defaultSettings.materials];
  }

  return settings;
};

const getGallery = () => safeReadJson(STORAGE_KEYS.gallery, []);
const getOrders = () => safeReadJson(STORAGE_KEYS.orders, []);

const renderSettings = () => {
  const settings = getSettings();
  document.querySelector("#colors-input").value = settings.colors.join("\n");
  document.querySelector("#materials-input").value = settings.materials.join("\n");
  document.querySelector("#pla-price-input").value = settings.pricing.plaPerGram;
  document.querySelector("#filament-cost-input").value = settings.pricing.filamentCost;
  document.querySelector("#labor-cost-input").value = settings.pricing.laborPerGram;
  document.querySelector("#shipping-note-input").value = settings.pricing.shippingNote;
};

const renderGallery = () => {
  const items = getGallery();
  if (!items.length) {
    adminGalleryGrid.innerHTML = '<div class="admin-gallery-item"><p class="admin-note">No gallery items added yet.</p></div>';
    return;
  }

  adminGalleryGrid.innerHTML = items
    .map(
      (item, index) => `
        <article class="admin-gallery-item">
          <img src="${item.image}" alt="${item.title}" />
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="mini-actions">
            <button class="button button-secondary" data-gallery-delete="${index}" type="button">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
};

const renderOrders = () => {
  const orders = getOrders();
  if (!orders.length) {
    orderList.innerHTML = '<div class="order-card"><p>No orders have been submitted yet.</p></div>';
    return;
  }

  orderList.innerHTML = orders
    .map(
      (order, index) => `
        <article class="order-card">
          <span class="status-chip">${order.status}</span>
          <h3>${order.id} - ${order.name}</h3>
          <p>${order.email} | ${order.phone}</p>
          <p>${order.address}</p>
          <div class="order-meta">
            <div><strong>File</strong><p>${order.fileName || "No file uploaded"}</p></div>
            <div><strong>Design by company</strong><p>${order.companyDesign ? "Yes" : "No"}</p></div>
            <div><strong>Settings</strong><p>${order.material}, ${order.color}, ${order.quality}</p></div>
            <div><strong>Layer / Infill</strong><p>${order.layerHeight}/5, ${order.infill}%</p></div>
          </div>
          <p><strong>Description:</strong> ${order.description || "Not provided"}</p>
          <div class="mini-actions">
            <button class="button button-secondary" data-order-status="${index}" data-value="Pending Review" type="button">Pending</button>
            <button class="button button-secondary" data-order-status="${index}" data-value="Quoted" type="button">Quoted</button>
            <button class="button button-secondary" data-order-status="${index}" data-value="In Production" type="button">In Production</button>
            <button class="button button-secondary" data-order-status="${index}" data-value="Completed" type="button">Completed</button>
          </div>
        </article>
      `
    )
    .join("");
};

const setLoggedIn = (value) => {
  writeJson(STORAGE_KEYS.auth, { loggedIn: value });
};

const isLoggedIn = () => {
  const auth = safeReadJson(STORAGE_KEYS.auth, { loggedIn: false });
  return Boolean(auth.loggedIn);
};

const toggleAdminView = () => {
  const loggedIn = isLoggedIn();
  loginSection.classList.toggle("hidden", loggedIn);
  adminSection.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    renderSettings();
    renderGallery();
    renderOrders();
  }
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = document.querySelector("#admin-password").value;

  if (password !== DEFAULT_PASSWORD) {
    loginError.textContent = "Incorrect password.";
    return;
  }

  loginError.textContent = "";
  setLoggedIn(true);
  toggleAdminView();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = {
    colors: document.querySelector("#colors-input").value.split("\n").map((item) => item.trim()).filter(Boolean),
    materials: document.querySelector("#materials-input").value.split("\n").map((item) => item.trim()).filter(Boolean),
    pricing: {
      plaPerGram: Number(document.querySelector("#pla-price-input").value) || 5,
      filamentCost: Number(document.querySelector("#filament-cost-input").value) || 1000,
      laborPerGram: Number(document.querySelector("#labor-cost-input").value) || 1.91,
      shippingNote: document.querySelector("#shipping-note-input").value.trim() || "Depends on location in Delhi NCR",
    },
  };

  writeJson(STORAGE_KEYS.settings, settings);
  settingsStatus.textContent = "Business settings updated.";
});

galleryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#gallery-title").value.trim();
  const description = document.querySelector("#gallery-description").value.trim();
  const file = document.querySelector("#gallery-image").files[0];

  if (!title || !description || !file) {
    galleryStatus.textContent = "Title, description, and image are required.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const items = getGallery();
    items.unshift({
      title,
      description,
      image: reader.result,
    });
    writeJson(STORAGE_KEYS.gallery, items);
    galleryStatus.textContent = "Gallery item added.";
    galleryForm.reset();
    renderGallery();
  };
  reader.readAsDataURL(file);
});

adminGalleryGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-delete]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.galleryDelete);
  const items = getGallery();
  items.splice(index, 1);
  writeJson(STORAGE_KEYS.gallery, items);
  renderGallery();
});

orderList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-status]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.orderStatus);
  const orders = getOrders();
  if (!orders[index]) {
    return;
  }

  orders[index].status = button.dataset.value;
  writeJson(STORAGE_KEYS.orders, orders);
  renderOrders();
});

logoutButton.addEventListener("click", () => {
  setLoggedIn(false);
  toggleAdminView();
});

ensureState();
toggleAdminView();
