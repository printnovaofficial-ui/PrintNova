const STORAGE_KEYS = {
  orders: "printnova-orders",
  settings: "printnova-settings",
};

const DEFAULT_SETTINGS = {
  colors: ["Arctic White", "Graphite Black", "Signal Red", "Ocean Blue", "Forest Green"],
};

const materialConfig = {
  pla: { label: "PLA", density: 1.24, multiplier: 1 },
  petg: { label: "PETG", density: 1.27, multiplier: 1.12 },
  abs: { label: "ABS", density: 1.04, multiplier: 1.18 },
  tpu: { label: "TPU", density: 1.21, multiplier: 1.28 },
};

const qualityConfig = {
  draft: { speed: 0.82, multiplier: 0.92 },
  standard: { speed: 1, multiplier: 1 },
  fine: { speed: 1.35, multiplier: 1.12 },
};

const shippingConfig = {
  delhi: { label: "Delhi", price: 80, eta: "2-3 days" },
  ncr: { label: "Gurugram / Noida / NCR", price: 150, eta: "2-4 days" },
  express: { label: "Express local courier", price: 240, eta: "24-48 hrs" },
};

const revealItems = document.querySelectorAll(".reveal");
const parallaxItems = document.querySelectorAll(".hero-copy, .hero-visual, .feature-band");
const tiltCards = document.querySelectorAll(".tilt-card");
const cursorGlow = document.querySelector(".cursor-glow");
const extruderCursor = document.querySelector(".extruder-cursor");
const quoteForm = document.querySelector("#quote-form");
const colorSelect = document.querySelector("#color");
const fileDisclaimer = document.querySelector("#file-disclaimer");
const orderStatus = document.querySelector("#order-status");
const previewCanvas = document.querySelector("#model-preview");
const trackingIdInput = document.querySelector("#tracking-id");
const trackingButton = document.querySelector("#tracking-button");
const trackingStatus = document.querySelector("#tracking-status");
const trackingCopy = document.querySelector("#tracking-copy");

const quoteFields = {
  customerName: document.querySelector("#customer-name"),
  customerPhone: document.querySelector("#customer-phone"),
  customerEmail: document.querySelector("#customer-email"),
  customerAddress: document.querySelector("#customer-address"),
  customerNotes: document.querySelector("#customer-notes"),
  file: document.querySelector("#model-file"),
  material: document.querySelector("#material"),
  color: colorSelect,
  quality: document.querySelector("#quality"),
  layerHeight: document.querySelector("#layer-height"),
  infill: document.querySelector("#infill"),
  length: document.querySelector("#length"),
  width: document.querySelector("#width"),
  height: document.querySelector("#height"),
  quantity: document.querySelector("#quantity"),
  shippingZone: document.querySelector("#shipping-zone"),
};

const quoteOutputs = {
  infillValue: document.querySelector("#infill-value"),
  fileName: document.querySelector("#file-name"),
  fileMeta: document.querySelector("#file-meta"),
  weight: document.querySelector("#weight-output"),
  printPrice: document.querySelector("#print-price-output"),
  shipping: document.querySelector("#shipping-output"),
  total: document.querySelector("#total-output"),
  weightSource: document.querySelector("#weight-source-output"),
  printTime: document.querySelector("#print-time-output"),
  delivery: document.querySelector("#delivery-output"),
  color: document.querySelector("#color-output"),
  material: document.querySelector("#material-output"),
};

const state = {
  uploadedModel: null,
  quote: null,
};

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
const formatWeight = (value) => `${Math.max(1, Math.round(value))} g`;

const drawPreview = (file) => {
  if (!previewCanvas) {
    return;
  }

  const ctx = previewCanvas.getContext("2d");
  const width = previewCanvas.width;
  const height = previewCanvas.height;
  const name = file ? file.name : "MODEL PREVIEW";
  const extension = file ? file.name.split(".").pop().toUpperCase() : "STL / 3MF";

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0c1728");
  bg.addColorStop(1, "#060b14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(85, 215, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 30; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 20; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const scale = 72;
  const cube = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  const project = ([x, y, z]) => {
    const rotY = x * Math.cos(0.65) - z * Math.sin(0.65);
    const rotZ = x * Math.sin(0.65) + z * Math.cos(0.65);
    const rotX = y * Math.cos(-0.45) - rotZ * Math.sin(-0.45);
    const depth = 4 + (y * Math.sin(-0.45) + rotZ * Math.cos(-0.45));
    return [centerX + (rotY * scale) / depth, centerY + (rotX * scale) / depth];
  };

  ctx.strokeStyle = "rgba(85, 215, 255, 0.88)";
  ctx.lineWidth = 2.2;
  edges.forEach(([start, end]) => {
    const [x1, y1] = project(cube[start]);
    const [x2, y2] = project(cube[end]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(245, 138, 36, 0.92)";
  ctx.fillRect(centerX - 8, centerY - 80, 16, 24);
  ctx.fillStyle = "rgba(85, 215, 255, 0.9)";
  ctx.fillRect(centerX - 4, centerY - 55, 8, 18);

  ctx.fillStyle = "#f4f7fb";
  ctx.font = '700 18px "Sora", sans-serif';
  ctx.fillText(extension, 24, height - 46);
  ctx.fillStyle = "#97a8bd";
  ctx.font = '500 13px "Space Grotesk", sans-serif';
  ctx.fillText(name.slice(0, 34), 24, height - 22);
};

const parseBinaryStl = (buffer) => {
  const view = new DataView(buffer);
  const faces = view.getUint32(80, true);
  let volume = 0;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const readVertex = (offset) => {
    const vertex = {
      x: view.getFloat32(offset, true),
      y: view.getFloat32(offset + 4, true),
      z: view.getFloat32(offset + 8, true),
    };
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    minZ = Math.min(minZ, vertex.z);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
    maxZ = Math.max(maxZ, vertex.z);
    return vertex;
  };

  for (let i = 0; i < faces; i += 1) {
    const offset = 84 + i * 50;
    const v1 = readVertex(offset + 12);
    const v2 = readVertex(offset + 24);
    const v3 = readVertex(offset + 36);
    volume += (
      v1.x * v2.y * v3.z +
      v2.x * v3.y * v1.z +
      v3.x * v1.y * v2.z -
      v1.x * v3.y * v2.z -
      v2.x * v1.y * v3.z -
      v3.x * v2.y * v1.z
    ) / 6;
  }

  return {
    volumeMm3: Math.abs(volume),
    bounds: {
      length: Math.max(0, maxX - minX),
      width: Math.max(0, maxY - minY),
      height: Math.max(0, maxZ - minZ),
    },
  };
};

const parseAsciiStl = (text) => {
  const matches = [...text.matchAll(/vertex\s+(-?\d*\.?\d+(?:e[-+]?\d+)?)\s+(-?\d*\.?\d+(?:e[-+]?\d+)?)\s+(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi)];
  let volume = 0;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < matches.length; i += 3) {
    const points = matches.slice(i, i + 3).map((match) => {
      const point = {
        x: Number(match[1]),
        y: Number(match[2]),
        z: Number(match[3]),
      };
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      minZ = Math.min(minZ, point.z);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      maxZ = Math.max(maxZ, point.z);
      return point;
    });

    if (points.length === 3) {
      const [v1, v2, v3] = points;
      volume += (
        v1.x * v2.y * v3.z +
        v2.x * v3.y * v1.z +
        v3.x * v1.y * v2.z -
        v1.x * v3.y * v2.z -
        v2.x * v1.y * v3.z -
        v3.x * v2.y * v1.z
      ) / 6;
    }
  }

  return {
    volumeMm3: Math.abs(volume),
    bounds: {
      length: Math.max(0, maxX - minX),
      width: Math.max(0, maxY - minY),
      height: Math.max(0, maxZ - minZ),
    },
  };
};

const analyzeUploadedModel = async (file) => {
  if (!file) {
    state.uploadedModel = null;
    return;
  }

  const extension = file.name.split(".").pop().toLowerCase();

  if (extension !== "stl") {
    state.uploadedModel = {
      fileName: file.name,
      fileSize: file.size,
      source: "manual",
      note: "3MF uploads currently use manual dimensions for weight estimation.",
    };
    return;
  }

  const buffer = await file.arrayBuffer();
  const header = new TextDecoder().decode(buffer.slice(0, 5)).toLowerCase();
  const model = header === "solid" ? parseAsciiStl(new TextDecoder().decode(buffer)) : parseBinaryStl(buffer);

  state.uploadedModel = {
    fileName: file.name,
    fileSize: file.size,
    source: "stl",
    volumeMm3: model.volumeMm3,
    bounds: model.bounds,
    note: "Weight estimated from STL geometry.",
  };

  if (model.bounds.length > 0 && model.bounds.width > 0 && model.bounds.height > 0) {
    quoteFields.length.value = Math.min(220, Math.max(1, Math.round(model.bounds.length)));
    quoteFields.width.value = Math.min(220, Math.max(1, Math.round(model.bounds.width)));
    quoteFields.height.value = Math.min(250, Math.max(1, Math.round(model.bounds.height)));
  }
};

const renderColors = () => {
  const settings = getSettings();
  const previous = colorSelect.value;
  colorSelect.innerHTML = settings.colors
    .map((color) => `<option value="${color}">${color}</option>`)
    .join("");

  if (settings.colors.includes(previous)) {
    colorSelect.value = previous;
  }
};

const buildQuote = () => {
  const material = materialConfig[quoteFields.material.value];
  const quality = qualityConfig[quoteFields.quality.value];
  const shipping = shippingConfig[quoteFields.shippingZone.value];
  const length = Math.min(Number(quoteFields.length.value) || 0, 220);
  const width = Math.min(Number(quoteFields.width.value) || 0, 220);
  const height = Math.min(Number(quoteFields.height.value) || 0, 250);
  const quantity = Math.max(Number(quoteFields.quantity.value) || 1, 1);
  const infill = Number(quoteFields.infill.value);
  const layerHeight = Number(quoteFields.layerHeight.value);
  const infillRatio = 0.18 + infill / 100;

  let weightPerUnit = 0;
  let weightSource = "Manual dimensions";

  if (state.uploadedModel?.source === "stl" && state.uploadedModel.volumeMm3) {
    const solidVolumeCm3 = state.uploadedModel.volumeMm3 / 1000;
    const effectiveVolumeCm3 = solidVolumeCm3 * (0.22 + infill / 100 * 0.78);
    weightPerUnit = effectiveVolumeCm3 * material.density;
    weightSource = "STL geometry";
  } else {
    const volumeCm3 = (length * width * height) / 1000;
    const shellFactor = 0.16;
    const effectiveVolumeCm3 = volumeCm3 * (shellFactor + infillRatio * 0.32);
    weightPerUnit = effectiveVolumeCm3 * material.density;
    if (state.uploadedModel?.source === "manual") {
      weightSource = "Manual dimensions (3MF fallback)";
    }
  }

  const totalWeight = weightPerUnit * quantity;
  const printPrice = Math.max(totalWeight * 5 * material.multiplier * quality.multiplier, 299);
  const shippingPrice = shipping.price;
  const total = printPrice + shippingPrice;
  const volumeReference = state.uploadedModel?.volumeMm3 ? state.uploadedModel.volumeMm3 / 1000 : (length * width * height) / 1000;
  const printHours = Math.max((volumeReference / 38) * quality.speed * (0.22 / layerHeight) * (0.72 + infill / 100) * quantity, 2.2);

  return {
    customer: {
      name: quoteFields.customerName.value.trim(),
      phone: quoteFields.customerPhone.value.trim(),
      email: quoteFields.customerEmail.value.trim(),
      address: quoteFields.customerAddress.value.trim(),
      notes: quoteFields.customerNotes.value.trim(),
    },
    settings: {
      material: material.label,
      color: quoteFields.color.value,
      quality: quoteFields.quality.value,
      layerHeight,
      infill,
      quantity,
      shippingZone: shipping.label,
    },
    dimensions: { length, width, height },
    file: state.uploadedModel
      ? {
          name: state.uploadedModel.fileName,
          size: state.uploadedModel.fileSize,
          source: state.uploadedModel.source,
          note: state.uploadedModel.note,
        }
      : null,
    disclaimer: state.uploadedModel ? "" : "No file uploaded. Support must contact this customer within 24 hours.",
    estimate: {
      weight: totalWeight,
      weightSource,
      printPrice,
      shippingPrice,
      total,
      printHours,
      delivery: shipping.eta,
    },
  };
};

const updateQuote = () => {
  const quote = buildQuote();
  state.quote = quote;

  quoteOutputs.infillValue.textContent = `${quote.settings.infill}%`;
  quoteOutputs.weight.textContent = formatWeight(quote.estimate.weight);
  quoteOutputs.printPrice.textContent = formatCurrency(quote.estimate.printPrice);
  quoteOutputs.shipping.textContent = formatCurrency(quote.estimate.shippingPrice);
  quoteOutputs.total.textContent = formatCurrency(quote.estimate.total);
  quoteOutputs.weightSource.textContent = quote.estimate.weightSource;
  quoteOutputs.printTime.textContent = `${quote.estimate.printHours.toFixed(1)} hrs`;
  quoteOutputs.delivery.textContent = quote.estimate.delivery;
  quoteOutputs.color.textContent = quote.settings.color;
  quoteOutputs.material.textContent = quote.settings.material;

  if (state.uploadedModel) {
    quoteOutputs.fileName.textContent = state.uploadedModel.fileName;
    quoteOutputs.fileMeta.textContent = `${state.uploadedModel.fileName.split(".").pop().toUpperCase()} • ${(state.uploadedModel.fileSize / 1024 / 1024).toFixed(2)} MB • ${quote.dimensions.length}×${quote.dimensions.width}×${quote.dimensions.height} mm`;
  } else {
    quoteOutputs.fileName.textContent = "No file uploaded yet";
    quoteOutputs.fileMeta.textContent = `Using manual dimensions: ${quote.dimensions.length}×${quote.dimensions.width}×${quote.dimensions.height} mm`;
  }

  fileDisclaimer.classList.toggle("is-visible", !state.uploadedModel);
};

const generateOrderId = () => {
  const orders = getOrders();
  const next = orders.length + 24031;
  return `PN-${next}`;
};

const submitOrder = () => {
  const quote = buildQuote();
  const orderId = generateOrderId();
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: "Pending Review",
    ...quote,
  };

  const orders = getOrders();
  orders.unshift(order);
  writeJson(STORAGE_KEYS.orders, orders);

  orderStatus.textContent = `Order ${orderId} sent to admin dashboard.`;
  trackingStatus.textContent = order.status;
  trackingCopy.textContent = `Your order was submitted. Save this ID: ${orderId}.`;
  trackingIdInput.value = orderId;
  window.dispatchEvent(new Event("storage"));
};

const findOrder = (id) => getOrders().find((order) => order.id === id);

const handleFileChange = async () => {
  const file = quoteFields.file.files[0];
  drawPreview(file || null);
  await analyzeUploadedModel(file);
  updateQuote();
};

const attachFieldEvents = () => {
  Object.values(quoteFields).forEach((field) => {
    if (!field || field === quoteFields.file) {
      return;
    }
    field.addEventListener("input", updateQuote);
    field.addEventListener("change", updateQuote);
  });

  quoteFields.file.addEventListener("change", handleFileChange);

  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) {
      return;
    }
    submitOrder();
  });

  trackingButton.addEventListener("click", () => {
    const id = trackingIdInput.value.trim().toUpperCase();
    const order = findOrder(id);

    if (order) {
      trackingStatus.textContent = order.status;
      trackingCopy.textContent = order.disclaimer || `${order.estimate.delivery} estimated delivery. ${formatWeight(order.estimate.weight)} estimated weight.`;
      return;
    }

    trackingStatus.textContent = "Order ID not found";
    trackingCopy.textContent = "Use the ID generated after order submission, or check the admin page in the same browser.";
  });

  window.addEventListener("storage", () => {
    renderColors();
    updateQuote();
  });
};

const initReveal = () => {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
};

const initParallax = () => {
  const updateParallax = () => {
    const viewportHeight = window.innerHeight;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const progress = (midpoint - viewportHeight / 2) / viewportHeight;
      item.style.setProperty("--parallax-shift", `${progress * -28}px`);
      item.classList.add("parallax");
    });
  };

  updateParallax();
  window.addEventListener("scroll", updateParallax, { passive: true });
  window.addEventListener("resize", updateParallax);
};

const initTilt = () => {
  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      card.style.setProperty("--rotateX", `${((y / bounds.height) - 0.5) * -10}deg`);
      card.style.setProperty("--rotateY", `${((x / bounds.width) - 0.5) * 10}deg`);
      card.style.setProperty("--pointer-x", `${(x / bounds.width) * 100}%`);
      card.style.setProperty("--pointer-y", `${(y / bounds.height) * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rotateX", "0deg");
      card.style.setProperty("--rotateY", "0deg");
      card.style.setProperty("--pointer-x", "50%");
      card.style.setProperty("--pointer-y", "50%");
    });
  });
};

const initCursor = () => {
  if (!cursorGlow || !extruderCursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  let cursorX = 0;
  let cursorY = 0;

  const renderCursor = () => {
    const isPressed = document.body.classList.contains("cursor-pressed");
    cursorGlow.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    extruderCursor.style.transform = `translate3d(${cursorX - 16}px, ${cursorY - 10}px, 0) rotate(${isPressed ? -4 : -16}deg) scale(${isPressed ? 0.94 : 1})`;
  };

  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("cursor-active");
    cursorX = event.clientX;
    cursorY = event.clientY;
    renderCursor();
  });

  window.addEventListener("pointerdown", () => {
    document.body.classList.add("cursor-pressed");
    renderCursor();
  });

  window.addEventListener("pointerup", () => {
    document.body.classList.remove("cursor-pressed");
    renderCursor();
  });

  document.addEventListener("mouseout", (event) => {
    if (event.relatedTarget === null) {
      document.body.classList.remove("cursor-active", "cursor-pressed");
    }
  });
};

const init = () => {
  if (!safeReadJson(STORAGE_KEYS.settings, null)) {
    writeJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }

  renderColors();
  drawPreview(null);
  initReveal();
  initParallax();
  initTilt();
  initCursor();
  attachFieldEvents();
  updateQuote();
};

init();
