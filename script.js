const STORAGE_KEYS = {
  gallery: "printnova-gallery-v2",
  orders: "printnova-orders-v2",
};

const DEFAULT_SETTINGS = {
  colors: ["Black", "White"],
  materials: ["PLA"],
  pricing: {
    plaPerGram: 5,
    filamentCost: 1000,
    laborPerGram: 1.91,
    electricalRange: "₹0.05-₹0.10/g",
    maintenanceRange: "₹0.05-₹0.15/g",
    packagingRange: "₹0.05-₹0.10/g",
    profitRange: "10%-20%",
    shippingNote: "Depends on location in Delhi NCR",
  },
};

const DEFAULT_GALLERY = [
  {
    title: "Prototype Housing",
    description: "Clean prototype print with a professional matte finish.",
    image:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#071c2a"/>
              <stop offset="100%" stop-color="#0e3951"/>
            </linearGradient>
            <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ebfbff"/>
              <stop offset="100%" stop-color="#56dbff"/>
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#a)"/>
          <rect x="180" y="150" width="440" height="280" rx="48" fill="url(#b)" opacity="0.95"/>
          <rect x="250" y="220" width="300" height="140" rx="24" fill="#0f3550"/>
          <circle cx="400" cy="290" r="44" fill="#dff9ff"/>
        </svg>
      `),
  },
  {
    title: "Display Model",
    description: "Decorative print sample for product visuals and showcase pieces.",
    image:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#03131d"/>
              <stop offset="100%" stop-color="#134764"/>
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#a)"/>
          <path d="M400 120 590 250 520 460 280 460 210 250Z" fill="#58dbff" opacity="0.95"/>
          <path d="M400 180 510 260 465 390 335 390 290 260Z" fill="#dff7ff"/>
        </svg>
      `),
  },
  {
    title: "Functional Part",
    description: "Suitable for utility parts and practical custom builds.",
    image:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#051925"/>
              <stop offset="100%" stop-color="#0f3f58"/>
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#a)"/>
          <circle cx="280" cy="300" r="110" fill="#b8f5ff"/>
          <circle cx="520" cy="300" r="110" fill="#58dbff"/>
          <rect x="250" y="270" width="300" height="60" rx="24" fill="#dff7ff"/>
        </svg>
      `),
  },
];

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

const getSettings = () => ({
  ...DEFAULT_SETTINGS,
  colors: [...DEFAULT_SETTINGS.colors],
  materials: [...DEFAULT_SETTINGS.materials],
  pricing: { ...DEFAULT_SETTINGS.pricing },
});

const getGallery = () => {
  const stored = safeReadJson(STORAGE_KEYS.gallery, null);
  return Array.isArray(stored) && stored.length ? stored : DEFAULT_GALLERY;
};

const getOrders = () => safeReadJson(STORAGE_KEYS.orders, []);

const orderForm = document.querySelector("#order-form");
const fileInput = document.querySelector("#customer-file");
const fileName = document.querySelector("#file-name");
const designCheckbox = document.querySelector("#company-design");
const designDescription = document.querySelector("#design-description");
const layerHeightInput = document.querySelector("#layer-height");
const infillInput = document.querySelector("#infill");
const qualityInput = document.querySelector("#quality");
const colorInput = document.querySelector("#color");
const materialInput = document.querySelector("#material");
const formError = document.querySelector("#form-error");
const successPanel = document.querySelector("#success-panel");
const galleryGrid = document.querySelector("#gallery-grid");
const printerParticles = document.querySelector("#printer-particles");

const createPrinterParticles = () => {
  if (!printerParticles) {
    return;
  }

  const particleMarkup = Array.from({ length: 16 }, (_, index) => {
    const left = 8 + ((index * 13) % 78);
    const delay = (index % 8) * 0.45;
    const duration = 4.6 + (index % 5) * 0.55;
    return `<span class="particle" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;"></span>`;
  }).join("");

  printerParticles.innerHTML = particleMarkup;
};

const syncRangeOutputs = () => {
  document.querySelector("#layer-height-value").textContent = layerHeightInput.value;
  document.querySelector("#infill-value").textContent = infillInput.value;
  document.querySelector("#summary-layer").textContent = `${layerHeightInput.value} / 5`;
  document.querySelector("#summary-infill").textContent = `${infillInput.value}%`;
};

const syncSelectOutputs = () => {
  document.querySelector("#summary-quality").textContent = qualityInput.value;
  document.querySelector("#summary-color").textContent = colorInput.value;
  document.querySelector("#summary-material").textContent = materialInput.value;
};

const populateSelections = () => {
  const settings = getSettings();

  colorInput.innerHTML = settings.colors.map((color) => `<option value="${color}">${color}</option>`).join("");
  materialInput.innerHTML = settings.materials.map((material) => `<option value="${material}">${material}</option>`).join("");

  syncSelectOutputs();
};

const renderGallery = () => {
  if (!galleryGrid) {
    return;
  }

  const items = getGallery();
  galleryGrid.innerHTML = items
    .map(
      (item) => `
        <article class="gallery-card">
          <img src="${item.image}" alt="${item.title}" />
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>
      `
    )
    .join("");
};

const setupRevealAnimations = () => {
  const targets = document.querySelectorAll(
    ".hero-copy, .hero-visual, .trust-strip article, .content-section .section-heading, .info-card, .pricing-card, .notice-panel, .order-form, .summary-card, .gallery-card, .faq-item, .filament-card"
  );

  targets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.14 }
  );

  targets.forEach((element) => observer.observe(element));
};

const setupTiltMotion = () => {
  const cards = document.querySelectorAll(".printer-card, .info-card, .pricing-card, .summary-card, .gallery-card, .filament-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
};

const setupHeroParallax = () => {
  const heroCopy = document.querySelector(".hero-copy");
  const heroVisual = document.querySelector(".hero-visual");

  if (!heroCopy || !heroVisual) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 14;
    heroCopy.style.transform = `translate3d(${x * -0.3}px, ${y * -0.25}px, 0)`;
    heroVisual.style.transform = `translate3d(${x * 0.45}px, ${y * 0.4}px, 0)`;
  });
};

const buildEmailBody = (payload) => {
  return [
    "New PrintNova order request",
    "",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Address: ${payload.address}`,
    "Delivery Region: Delhi NCR only",
    "",
    `File Uploaded: ${payload.fileName || "No"}`,
    `Designed by Company: ${payload.companyDesign ? "Yes" : "No"}`,
    `Description: ${payload.description || "Not provided"}`,
    "",
    `Layer Height: ${payload.layerHeight}/5`,
    `Infill: ${payload.infill}%`,
    `Quality: ${payload.quality}`,
    `Color: ${payload.color}`,
    `Material: ${payload.material}`,
    "",
    "Pricing notes shown on website:",
    "PLA = Rs. 5/gram + delivery charges",
    "Filament cost: 1000",
    "Labor charges: Rs. 1.91/g",
    "Electrical charges: Rs. 0.05-0.10/g",
    "Maintenance: Rs. 0.05-0.15/g",
    "Packaging: Rs. 0.05-0.10/g",
    "Profit: nearly 10-20%",
    "Shipping cost depends on location",
    "",
    "Customer was informed that final pricing will be shared after order placement and can be declined before production.",
  ].join("\n");
};

const trySendWithFormSubmit = async (payload) => {
  const response = await fetch("https://formsubmit.co/ajax/printnovaofficial@gmail.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: `PrintNova Order Request - ${payload.name}`,
      _template: "table",
      _captcha: "false",
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      delivery_region: "Delhi NCR only",
      file_uploaded: payload.fileName || "No file uploaded",
      designed_by_company: payload.companyDesign ? "Yes" : "No",
      design_description: payload.description || "Not provided",
      layer_height: `${payload.layerHeight}/5`,
      infill: `${payload.infill}%`,
      quality: payload.quality,
      color: payload.color,
      material: payload.material,
      pricing_note: "PLA = Rs. 5/gram + delivery charges. Final price shared after order placement.",
    }),
  });

  if (!response.ok) {
    throw new Error("Remote mail request failed");
  }
};

const openMailClientFallback = (payload) => {
  const subject = encodeURIComponent(`PrintNova Order Request - ${payload.name}`);
  const body = encodeURIComponent(buildEmailBody(payload));
  window.location.href = `mailto:printnovaofficial@gmail.com?subject=${subject}&body=${body}`;
};

const validateForm = () => {
  const name = document.querySelector("#customer-name").value.trim();
  const phone = document.querySelector("#customer-phone").value.trim();
  const email = document.querySelector("#customer-email").value.trim();
  const address = document.querySelector("#customer-address").value.trim();
  const file = fileInput.files[0];
  const companyDesign = designCheckbox.checked;
  const description = designDescription.value.trim();

  if (!name || !phone || !email || !address) {
    return { valid: false, error: "Please complete all mandatory contact fields." };
  }

  if (!/^\d{10}$/.test(phone)) {
    return { valid: false, error: "Phone number must be exactly 10 digits." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Please enter a valid email ID." };
  }

  if (!/delhi|noida|gurugram|gurgaon|ghaziabad|faridabad/i.test(address)) {
    return { valid: false, error: "Delivery is applicable only in Delhi NCR. Please enter a Delhi NCR address." };
  }

  if (!file && !companyDesign) {
    return { valid: false, error: "You must either upload a file or choose 'Designed by the company'." };
  }

  if (companyDesign && !description) {
    return { valid: false, error: "Description is mandatory when 'Designed by the company' is selected." };
  }

  return {
    valid: true,
    payload: {
      name,
      phone,
      email,
      address,
      fileName: file ? file.name : "",
      companyDesign,
      description,
      layerHeight: layerHeightInput.value,
      infill: infillInput.value,
      quality: qualityInput.value,
      color: colorInput.value,
      material: materialInput.value,
      createdAt: new Date().toISOString(),
      status: "Pending Review",
    },
  };
};

const saveOrderLocally = (payload) => {
  const orders = getOrders();
  orders.unshift({
    id: `PN-${Date.now().toString().slice(-6)}`,
    ...payload,
  });
  writeJson(STORAGE_KEYS.orders, orders);
};

const resetFormState = () => {
  orderForm.reset();
  fileName.textContent = "No file selected.";
  populateSelections();
  syncRangeOutputs();
  syncSelectOutputs();
};

if (fileInput) {
  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : "No file selected.";
  });
}

if (layerHeightInput && infillInput) {
  layerHeightInput.addEventListener("input", syncRangeOutputs);
  infillInput.addEventListener("input", syncRangeOutputs);
}

if (qualityInput && colorInput && materialInput) {
  qualityInput.addEventListener("change", syncSelectOutputs);
  colorInput.addEventListener("change", syncSelectOutputs);
  materialInput.addEventListener("change", syncSelectOutputs);
}

if (orderForm) {
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";

    const result = validateForm();
    if (!result.valid) {
      formError.textContent = result.error;
      successPanel.classList.add("hidden");
      return;
    }

    saveOrderLocally(result.payload);

    try {
      await trySendWithFormSubmit(result.payload);
    } catch {
      openMailClientFallback(result.payload);
    }

    successPanel.classList.remove("hidden");
    resetFormState();
    window.scrollTo({ top: successPanel.offsetTop - 120, behavior: "smooth" });
  });
}

if (!safeReadJson(STORAGE_KEYS.gallery, null)) {
  writeJson(STORAGE_KEYS.gallery, DEFAULT_GALLERY);
}

populateSelections();
renderGallery();
syncRangeOutputs();
syncSelectOutputs();
createPrinterParticles();
setupRevealAnimations();
setupTiltMotion();
setupHeroParallax();

window.addEventListener("storage", () => {
  renderGallery();
  syncSelectOutputs();
});
