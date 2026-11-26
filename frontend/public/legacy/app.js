let products = [
  { id: 1, name: "Nerd wooden chair", category: "Furniture", price: 599, badge: "-25%", image: "img/ref-furniture-01.webp", hoverImage: "img/ref-furniture-01-hover.webp", color: "#d9b469", alt: "Nerd wooden chair", description: "A sculptural wood frame and soft seat bring a little Scandinavian character to everyday dining.", collections: ["Best Sellers", "Sales"] },
  { id: 2, name: "Panton Junior Chair", category: "Furniture", price: 199, badge: "New", image: "img/ref-furniture-02.jpg", hoverImage: "img/ref-furniture-02-hover.jpg", color: "#85b8ae", alt: "Panton Junior chair", description: "An iconic, playful silhouette with a comfortable seat and a fresh pop of color.", collections: ["Best Sellers", "Featured"] },
  { id: 3, name: "Wooden na\u00EFve chair", category: "Furniture", price: 119, badge: "", image: "img/ref-furniture-03.webp", hoverImage: "img/ref-furniture-03-hover.webp", color: "#c89d6e", alt: "Wooden na\u00EFve chair", description: "A rounded back and warm wooden legs bring a relaxed, organic feel to the dining room.", collections: ["Best Sellers", "Featured"] },
  { id: 4, name: "Eames lounge chair", category: "Furniture", price: 399, badge: "-50%", image: "img/ref-furniture-04.webp", hoverImage: "img/ref-furniture-04-hover.webp", color: "#77543b", alt: "Eames lounge chair", description: "A timeless lounge chair with a generous seat, rich upholstery and a beautifully sculpted frame.", collections: ["Featured", "Sales"] },
  { id: 5, name: "Wooden single drawer", category: "Furniture", price: 249, badge: "", image: "img/ref-furniture-05.jpg", hoverImage: "img/ref-furniture-05-hover.webp", color: "#d9b469", alt: "Wooden single drawer", description: "A simple storage piece with clean lines, a handy drawer and carefully angled legs.", collections: ["Best Sellers"] },
  { id: 6, name: "Eames Plastic Side Chair", category: "Furniture", price: 99, badge: "New", image: "img/ref-furniture-06.jpg", hoverImage: "img/ref-furniture-06-hover.jpg", color: "#85b8ae", alt: "Eames Plastic Side Chair", description: "A familiar modern profile made comfortable for the everyday, with a light, sturdy base.", collections: ["Featured"] },
  { id: 7, name: "Char with love", category: "Furniture", price: 420, badge: "", image: "img/ref-furniture-07.webp", hoverImage: "img/ref-furniture-07-hover.webp", color: "#c89d6e", alt: "Contemporary accent chair", description: "A softly curved accent chair that makes a welcoming place to pause and unwind.", collections: ["Best Sellers", "Featured"] }
];

const productGrid = document.querySelector(".product-grid");
const emptyState = document.querySelector(".empty-state");
const cartDrawer = document.querySelector(".cart-drawer");
const backdrop = document.querySelector(".drawer-backdrop");
const toast = document.querySelector(".toast");
productGrid.addEventListener("click", (event) => {
  if (event.target.closest("a,button")) return;
  const card = event.target.closest(".product-card[data-product-id]");
  if (card) window.location.href = `/product?id=${encodeURIComponent(card.dataset.productId)}`;
});
const cart = new Map();
const wishlist = new Set(window.HomeShapeLists.get("wishlist").map((item) => Number(item.id)));
let activeFilter = "All";
let activeProductTab = "Best Sellers";
let searchQuery = "";
let toastTimeout;
let productAnimationTimeout;

function formatPrice(value) {
  return `د.إ ${value.toFixed(2)}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function productImage(product) {
  return product.image;
}

function setActiveFilter(category) {
  activeFilter = category;
  document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.filter === category));
  document.querySelector(".search-category").value = category;
  renderProducts();
}

function renderProducts(animate = false) {
  const shown = products.filter((product) => product.collections.includes(activeProductTab)).filter((product) => {
    const matchesCategory = activeFilter === "All" || product.category === activeFilter || product.category.startsWith(`${activeFilter} > `);
    const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  clearTimeout(productAnimationTimeout);
  productGrid.classList.remove("is-animating");
  productGrid.innerHTML = shown.map((product) => `
    <article class="product-card" data-product-id="${encodeURIComponent(product.id)}">
      <div class="product-image-wrap">
        <a class="product-image-link" href="/product?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHtml(product.name)}"><img class="product-image" src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.alt)}" loading="lazy" />${product.hoverImage ? `<img class="product-image-hover" src="${escapeHtml(product.hoverImage)}" alt="" loading="lazy" />` : ""}</a>
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        <button class="product-heart${wishlist.has(product.id) ? " selected" : ""}" type="button" data-wishlist="${product.id}" aria-label="${wishlist.has(product.id) ? "Remove from" : "Add to"} wishlist">${wishlist.has(product.id) ? "♥" : "♡"}</button>
        <button class="quick-add" type="button" data-add="${product.id}">Add to bag — ${formatPrice(product.price)}</button>
      </div>
      <div class="product-details">
        <div class="product-meta"><h3 class="product-name"><a href="/product?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3><span class="product-price">${formatPrice(product.price)}</span></div>
        <p class="product-category">${escapeHtml(product.category)}</p>
        <div class="product-swatches" aria-label="Available colors"><span class="swatch" style="background:${product.color}"></span><span class="swatch" style="background:#e5e0d4"></span></div>
      </div>
      <div class="product-hover-details">
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-hover-actions">
          <button class="product-heart${wishlist.has(product.id) ? " selected" : ""}" type="button" data-wishlist="${product.id}" aria-label="Wishlist">${wishlist.has(product.id) ? "♥" : "♡"}</button>
          <button class="product-compare-home${window.HomeShapeLists.has("compare", product.id) ? " selected" : ""}" type="button" data-compare="${product.id}" aria-label="Add to compare" aria-pressed="${window.HomeShapeLists.has("compare", product.id)}">⇄</button>
          <button class="quick-add" type="button" data-add="${product.id}" ${product.badge === "Sold out" ? "disabled" : ""}>${product.badge === "Sold out" ? "Sold out" : `Add to cart — ${formatPrice(product.price)}`}</button>
        </div>
      </div>
    </article>
  `).join("");
  emptyState.hidden = shown.length > 0;
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void productGrid.offsetWidth;
    productGrid.classList.add("is-animating");
    productAnimationTimeout = setTimeout(() => productGrid.classList.remove("is-animating"), 550);
  }
}

function setActiveProductTab(button) {
  activeProductTab = button.dataset.productTab;
  document.querySelectorAll("[data-product-tab]").forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  productGrid.setAttribute("aria-labelledby", button.id);
  renderProducts(true);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function updateCounts() {
  const cartCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  document.querySelector(".cart-count").textContent = cartCount;
  document.querySelector(".wishlist-count").textContent = wishlist.size;
  document.querySelector(".cart-total").textContent = formatPrice(subtotal);
  document.querySelector(".drawer-count").textContent = `(${cartCount})`;
}

function renderCart() {
  const items = [...cart.values()];
  const cartItems = document.querySelector(".cart-items");
  const empty = document.querySelector(".cart-empty");
  const summary = document.querySelector(".cart-summary");
  cartItems.innerHTML = items.map(({ product, quantity }) => `
    <div class="cart-line">
      <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.alt)}" />
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${formatPrice(product.price)}</p>
        <div class="quantity-control">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${quantity}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-remove="${product.id}">Remove</button>
    </div>
  `).join("");
  empty.hidden = items.length > 0;
  summary.hidden = items.length === 0;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  summary.querySelector(".subtotal-row strong").textContent = formatPrice(subtotal);
  updateCounts();
}

function openCart() {
  renderCart();
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add("visible");
    cartDrawer.classList.add("open");
  });
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  backdrop.classList.remove("visible");
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setTimeout(() => { backdrop.hidden = true; }, 250);
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const heartButton = event.target.closest("[data-wishlist]");
  const compareButton = event.target.closest("[data-compare]");

  if (addButton) {
    const product = products.find((item) => item.id === Number(addButton.dataset.add));
    const existing = cart.get(product.id);
    cart.set(product.id, { product, quantity: (existing?.quantity ?? 0) + 1 });
    updateCounts();
    showToast(`${product.name} added to your bag`);
  }
  if (heartButton) {
    const id = Number(heartButton.dataset.wishlist);
    const product = products.find((item) => item.id === id);
    const selected = product ? window.HomeShapeLists.toggle("wishlist", product) : false;
    selected ? wishlist.add(id) : wishlist.delete(id);
    renderProducts();
    updateCounts();
    showToast(selected ? "Added to your wishlist" : "Removed from your wishlist");
  }
  if (compareButton) {
    const product = products.find((item) => item.id === Number(compareButton.dataset.compare));
    if (product) {
      const selected = window.HomeShapeLists.toggle("compare", product);
      showToast(selected ? "Added to compare" : "Removed from compare");
    }
  }
});

const searchForm = document.querySelector(".header-search-form");
const searchInput = searchForm.querySelector('input[type="search"]');
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  renderProducts();
});
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector(".search-category").addEventListener("change", (event) => setActiveFilter(event.currentTarget.value));
document.querySelector(".filter-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-tab]");
  if (!button) return;
  setActiveProductTab(button);
});
document.querySelector(".product-carousel").addEventListener("click", (event) => {
  const arrow = event.target.closest("[data-tab-step]");
  if (!arrow) return;
  const tabs = [...document.querySelectorAll("[data-product-tab]")];
  const activeIndex = tabs.findIndex((tab) => tab.dataset.productTab === activeProductTab);
  const nextIndex = (activeIndex + Number(arrow.dataset.tabStep) + tabs.length) % tabs.length;
  setActiveProductTab(tabs[nextIndex]);
});
document.querySelectorAll("[data-category]").forEach((link) => {
  link.addEventListener("click", () => {
    const category = link.dataset.category;
    if (!["All", "Furniture", "Lighting", "Accessories"].includes(category)) return;
    setActiveFilter(category);
  });
});

document.querySelector(".cart-toggle").addEventListener("click", openCart);
document.querySelector(".drawer-close").addEventListener("click", closeCart);
document.querySelector(".continue-shopping").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.querySelector(".cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const id = Number(quantityButton.dataset.quantity);
    const item = cart.get(id);
    const quantity = item.quantity + Number(quantityButton.dataset.change);
    if (quantity < 1) cart.delete(id);
    else cart.set(id, { ...item, quantity });
    renderCart();
  }
  if (removeButton) {
    cart.delete(Number(removeButton.dataset.remove));
    renderCart();
  }
});

document.querySelector(".checkout-button").addEventListener("click", () => { localStorage.setItem("home_shape_checkout_cart", JSON.stringify([...cart.values()].map(({ product, quantity }) => ({ id: product.id, quantity })))); window.location.href = "/checkout"; });
document.querySelector(".wishlist-header").addEventListener("click", () => {
  window.location.href = "/wishlist";
});
document.querySelector(".mobile-menu-button").addEventListener("click", (event) => {
  const nav = document.querySelector(".main-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

const sortButton = document.querySelector(".sort-button");
if (sortButton) {
  sortButton.addEventListener("click", () => {
    products.reverse();
    renderProducts();
    showToast("Showing a fresh arrangement");
  });
}

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("You're on the list. Keep an eye on your inbox!");
  event.currentTarget.reset();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    document.querySelector(".main-nav").classList.remove("open");
    document.querySelector(".mobile-menu-button").setAttribute("aria-expanded", "false");
  }
});

const hero = document.querySelector(".hero");
const heroImage = hero.querySelector(".hero-visual > img");
const heroDots = [...hero.querySelectorAll(".hero-pagination button:not(.hero-autoplay-toggle)")];
const autoplayButton = hero.querySelector(".hero-autoplay-toggle");
const heroSlides = [
  {
    image: "img/slider-main-demo-1.jpg.webp",
    alt: "Sculptural ashwood rocking chair with a golden yellow seat",
    eyebrow: "Designed for everyday living",
    title: "Take a seat.",
    emphasis: "stay a while.",
    description: "An easygoing rocker in sculpted ash, with a sunshine-soft seat for everyday pauses.",
    variants: "img/swatch-main-demo-light-slider-x2-compressed.png",
    variantsAlt: "Four views of the ashwood rocking chair",
    price: "د.إ 199.00",
    label: "THE EVERYDAY ICONS EDIT"
  },
  {
    image: "img/slider-main-demo-2-light-opt.jpg.webp",
    alt: "White molded chair with a soft teal seat and oak legs",
    eyebrow: "A classic with a softer side",
    title: "Modern form.",
    emphasis: "softer edges.",
    description: "A familiar silhouette, thoughtfully reimagined for slow mornings and long conversations.",
    variants: "img/swatch-main-demo-light-slider-2-x2.png",
    variantsAlt: "Available teal, red, and yellow chair colors",
    price: "د.إ 149.00",
    label: "COLOUR, COMFORT, CHARACTER"
  },
  {
    image: "img/slider-main-demo-3-light-opt.jpg.webp",
    alt: "Sculptural ribbon-shaped lounge chair in natural wood",
    eyebrow: "Sculpted by nature",
    title: "Sculpted for",
    emphasis: "slow living.",
    description: "Natural curves and beautiful craftsmanship turn a quiet corner into your favourite place.",
    variants: "",
    variantsAlt: "",
    price: "د.إ 329.00",
    label: "MADE FOR A SLOWER PACE"
  }
];
window.addEventListener("cms:loaded", async (event) => {
  const site = event.detail;
  if (site?.heroSlides?.length) {
    heroSlides.splice(0, heroSlides.length, ...site.heroSlides.slice(0, 3).map((slide) => ({ ...slide, alt: slide.title, label: slide.eyebrow, variants: "", variantsAlt: "" })));
    heroDots.forEach((dot, index) => { dot.hidden = index >= heroSlides.length; });
  }
  else if (site && heroSlides[0]) heroSlides[0] = { ...heroSlides[0], image: site.heroImage || heroSlides[0].image, eyebrow: site.heroEyebrow || heroSlides[0].eyebrow, title: site.heroTitle || heroSlides[0].title, emphasis: site.heroEmphasis || heroSlides[0].emphasis, description: site.heroDescription || heroSlides[0].description, price: site.heroPrice || heroSlides[0].price };
  if (site) {
    const setText = (selector, value) => { const node = document.querySelector(selector); if (node && value) node.textContent = value; };
    setText(".featured-categories-heading > p", site.homeCollectionKicker);
    setText("#collections-title", site.homeCollectionTitle);
    setText(".featured-categories-heading > span", site.homeCollectionDescription);
    setText(".product-section-kicker", site.homeProductKicker);
    setText("#products-title", site.homeProductsTitle);
    setText(".product-section-description", site.homeProductsDescription);
    setText(".all-in-one-kicker", site.homeAboutKicker);
    setText("#all-in-one-title", site.homeAboutTitle);
    setText(".all-in-one-description", site.homeAboutDescription);
    const storyImage = document.querySelector(".all-in-one-image");
    if (storyImage && site.homeAboutImage) storyImage.src = site.homeAboutImage;
    if (storyImage && site.homeAboutImageAlt) storyImage.alt = site.homeAboutImageAlt;
    const storyLinks = document.querySelectorAll(".all-in-one-actions a");
    if (storyLinks[0] && site.homeAboutReadUrl) storyLinks[0].href = site.homeAboutReadUrl;
    if (storyLinks[1] && site.homeAboutContactUrl) storyLinks[1].href = site.homeAboutContactUrl;
    setText("#join-newsletter-title", site.homeNewsletterTitle);
    setText(".latest-news-kicker", site.homeJournalKicker);
    setText("#latest-news-title", site.homeJournalTitle);
    setText(".latest-news-heading > p:last-child", site.homeJournalDescription);
    if (Array.isArray(site.featuredCategories) && site.featuredCategories.length) {
      const grid = document.querySelector(".featured-category-grid");
      grid.innerHTML = site.featuredCategories.map((item, index) => `<a href="furniture.html?category=${encodeURIComponent(item.name)}" class="featured-category-card${index === 0 ? " featured-category-card--large" : ""}"><span class="featured-category-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" /></span><span class="featured-category-title">${escapeHtml(item.name)}</span></a>`).join("");
    }
    if (Array.isArray(site.homeLandingSlides)) {
      landingSlides.forEach((slide, index) => { slide.hidden = index >= site.homeLandingSlides.length; });
      landingDots.forEach((dot, index) => { dot.hidden = index >= site.homeLandingSlides.length; });
      site.homeLandingSlides.forEach((item, index) => {
      const slide = landingSlides[index]; if (!slide) return;
      slide.querySelector(".landing-kicker").lastChild.textContent = ` ${item.kicker || "Product landing page"}`;
      slide.querySelector(".landing-copy h2").textContent = item.title;
      const specs = slide.querySelectorAll(".landing-specs strong");
      [item.designer, item.materials, item.client].forEach((value, specIndex) => { if (specs[specIndex]) specs[specIndex].textContent = value; });
      slide.querySelector(".landing-buy > strong").textContent = item.price;
      const image = slide.querySelector(".landing-art img"); image.src = item.image; image.alt = item.title;
      const key = ["vitra", "lamp", "pattern"][index];
      const price = Number(String(item.price).replace(/[^0-9.]/g, "")) || 0;
      if (key) landingCartProducts[key] = { id: `landing-${index + 1}`, name: item.title, category: "Furniture", price, image: item.image, alt: item.title };
      });
    }
    if (Array.isArray(site.homeBrands) && site.homeBrands.length) renderBrandItems(site.homeBrands);
  }
  try {
    const response = await fetch(window.storeApiUrl("products"));
    if (!response.ok) return;
    const catalog = await response.json();
    if (!Array.isArray(catalog) || !catalog.length) return;
    products = catalog.map((product) => ({
      ...product,
      alt: product.alt || product.name,
      old: product.oldPrice ?? product.old,
      collections: product.collections?.length ? product.collections : ["Featured"]
    }));
    renderProducts();
  } catch (error) {
    console.warn("The live product catalog could not be loaded; showing the saved storefront catalog.", error);
  }
});
let activeHeroSlide = 0;
let heroTimer;
let heroTransitionTimer;
let heroEnterTimer;
let heroIntroTimer;
let heroAutoplay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
hero.classList.add("hero-intro");
heroIntroTimer = setTimeout(() => hero.classList.remove("hero-intro"), 1400);

function updateHeroSlide(index) {
  const nextIndex = (index + heroSlides.length) % heroSlides.length;
  if (nextIndex === activeHeroSlide) return;
  activeHeroSlide = nextIndex;
  const slide = heroSlides[activeHeroSlide];
  clearTimeout(heroIntroTimer);
  hero.classList.remove("hero-intro");
  clearTimeout(heroTransitionTimer);
  clearTimeout(heroEnterTimer);
  hero.classList.remove("is-entering");
  hero.classList.add("is-changing");
  heroTransitionTimer = setTimeout(() => {
    heroImage.src = slide.image;
    heroImage.alt = slide.alt;
    hero.querySelector(".hero-eyebrow-text").textContent = slide.eyebrow;
    hero.querySelector(".hero-title-line").textContent = slide.title;
    hero.querySelector(".hero-title-emphasis").textContent = slide.emphasis;
    hero.querySelector(".hero-description").textContent = slide.description;
    const variants = hero.querySelector(".hero-variants");
    const variantsImage = variants.querySelector("img");
    variants.hidden = !slide.variants;
    if (slide.variants) {
      variantsImage.src = slide.variants;
      variantsImage.alt = slide.variantsAlt;
    }
    const price = hero.querySelector(".hero-price");
    price.textContent = slide.price;
    price.setAttribute("aria-label", `Shop the featured item for ${slide.price}`);
    hero.querySelector(".hero-image-label > span:first-child").textContent = slide.label;
    hero.querySelector(".hero-slide-count").textContent = `0${activeHeroSlide + 1} — 0${heroSlides.length}`;
    heroDots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeHeroSlide;
      dot.classList.toggle("pagination-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    hero.classList.remove("is-changing");
    hero.classList.add("is-entering");
    heroEnterTimer = setTimeout(() => hero.classList.remove("is-entering"), 1200);
  }, 480);
}

function startHeroAutoplay() {
  clearInterval(heroTimer);
  if (heroAutoplay && !document.hidden) {
    heroTimer = setInterval(() => updateHeroSlide(activeHeroSlide + 1), 5200);
  }
}

hero.querySelector(".hero-arrow-next").addEventListener("click", () => {
  updateHeroSlide(activeHeroSlide + 1);
  startHeroAutoplay();
});
heroDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    updateHeroSlide(index);
    startHeroAutoplay();
  });
});
autoplayButton.addEventListener("click", () => {
  heroAutoplay = !heroAutoplay;
  autoplayButton.setAttribute("aria-label", heroAutoplay ? "Pause slideshow" : "Play slideshow");
  autoplayButton.classList.toggle("is-paused", !heroAutoplay);
  autoplayButton.querySelector("path").setAttribute("d", heroAutoplay ? "M9 6v12m6-12v12" : "m8 5 11 7-11 7z");
  startHeroAutoplay();
});
document.addEventListener("visibilitychange", startHeroAutoplay);

const landingCarousel = document.querySelector(".product-landing");
const landingSlides = [...landingCarousel.querySelectorAll("[data-landing-slide]")];
const landingDots = [...landingCarousel.querySelectorAll("[data-landing-go]")];
const landingCartProducts = {
  vitra: { id: 101, name: "Vitra Chair – Classic Design", category: "Furniture", price: 1999, image: "img/product-furniture-8.jpg", alt: "Black leather and walnut classic lounge chair" },
  lamp: { id: 102, name: "Woodspot – Lamp by Seletti", category: "Lighting", price: 240, image: "img/lamp-new-opt-2.png.webp", alt: "Colorful sculptural wood lamps" },
  pattern: { id: 103, name: "Woodspot – Modern Pattern", category: "Furniture", price: 299, image: "img/slide-3-on-green-sized-opt.png.webp", alt: "Geometric wood and honeycomb modern pattern furniture" }
};
let activeLandingSlide = 0;
let landingTimer;
let landingTouchStart = null;

function showLandingSlide(index) {
  activeLandingSlide = (index + landingSlides.length) % landingSlides.length;
  landingSlides.forEach((slide, slideIndex) => {
    const active = slideIndex === activeLandingSlide;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
  });
  landingDots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeLandingSlide;
    dot.classList.toggle("is-active", active);
    if (active) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
}

function startLandingAutoplay() {
  clearInterval(landingTimer);
  if (!document.hidden) landingTimer = setInterval(() => showLandingSlide(activeLandingSlide + 1), 7500);
}

landingDots.forEach((dot) => dot.addEventListener("click", () => {
  showLandingSlide(Number(dot.dataset.landingGo));
  startLandingAutoplay();
}));
landingCarousel.addEventListener("touchstart", (event) => {
  landingTouchStart = event.changedTouches[0].clientX;
}, { passive: true });
landingCarousel.addEventListener("touchend", (event) => {
  if (landingTouchStart === null) return;
  const distance = event.changedTouches[0].clientX - landingTouchStart;
  if (Math.abs(distance) > 45) showLandingSlide(activeLandingSlide + (distance < 0 ? 1 : -1));
  landingTouchStart = null;
  startLandingAutoplay();
}, { passive: true });
landingCarousel.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  showLandingSlide(activeLandingSlide + (event.key === "ArrowRight" ? 1 : -1));
  startLandingAutoplay();
});
landingCarousel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-landing-add]");
  if (!button) return;
  const product = landingCartProducts[button.dataset.landingAdd];
  const existing = cart.get(product.id);
  cart.set(product.id, { product, quantity: (existing?.quantity ?? 0) + 1 });
  updateCounts();
  showToast(`${product.name} added to your bag`);
});
document.addEventListener("visibilitychange", startLandingAutoplay);
showLandingSlide(0);
startLandingAutoplay();

const newsViewport = document.querySelector(".news-viewport");
const newsTrack = document.querySelector(".news-track");
function moveNewsCarousel(direction) {
  const card = newsTrack.querySelector(".news-card");
  const gap = Number.parseFloat(getComputedStyle(newsTrack).columnGap) || 0;
  const step = card.getBoundingClientRect().width + gap;
  const maxScroll = newsViewport.scrollWidth - newsViewport.clientWidth;
  const destination = newsViewport.scrollLeft + direction * step;
  if (destination > maxScroll - 8) newsViewport.scrollTo({ left: 0, behavior: "smooth" });
  else if (destination < 8) newsViewport.scrollTo({ left: maxScroll, behavior: "smooth" });
  else newsViewport.scrollTo({ left: destination, behavior: "smooth" });
}
document.querySelector(".news-arrow-prev").addEventListener("click", () => moveNewsCarousel(-1));
document.querySelector(".news-arrow-next").addEventListener("click", () => moveNewsCarousel(1));
newsViewport.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveNewsCarousel(event.key === "ArrowRight" ? 1 : -1);
});

const brandCarousel = document.querySelector(".brand-carousel");
const brandViewport = brandCarousel.querySelector(".brand-viewport");
const brandTrack = brandCarousel.querySelector(".brand-track");
let brandSlides = [...brandTrack.querySelectorAll(".brand-slide")];
let brandCount = brandSlides.length;
let brandIndex = brandCount;
let brandTimer;
brandTrack.prepend(...brandSlides.map((slide) => slide.cloneNode(true)));
brandTrack.append(...brandSlides.map((slide) => slide.cloneNode(true)));

function renderBrandItems(items) {
  const safeItems = items.filter((item) => item.name && item.image);
  if (!safeItems.length) return;
  const makeSlide = (item) => {
    const slide = document.createElement("div"); slide.className = "brand-slide";
    const link = document.createElement("a"); link.href = "#brands"; link.setAttribute("aria-label", item.name);
    const image = document.createElement("img"); image.src = item.image; image.alt = item.name; image.loading = "lazy";
    link.append(image); slide.append(link); return slide;
  };
  brandSlides = safeItems.map(makeSlide); brandCount = brandSlides.length; brandIndex = brandCount;
  brandTrack.replaceChildren(...brandSlides.map((item) => item.cloneNode(true)), ...brandSlides.map((item) => item.cloneNode(true)), ...brandSlides.map((item) => item.cloneNode(true)));
  positionBrandTrack(true);
}

function positionBrandTrack(jump = false) {
  const slideWidth = brandTrack.querySelector(".brand-slide").getBoundingClientRect().width;
  if (jump) brandTrack.style.transition = "none";
  brandTrack.style.transform = `translate3d(${-brandIndex * slideWidth}px, 0, 0)`;
  if (jump) requestAnimationFrame(() => { brandTrack.style.transition = ""; });
}

function moveBrand(direction) {
  brandIndex += direction;
  positionBrandTrack();
  if (brandIndex >= brandCount * 2 || brandIndex < brandCount) {
    const resetIndex = brandIndex >= brandCount * 2 ? brandCount : brandCount * 2 - 1;
    setTimeout(() => {
      brandIndex = resetIndex;
      positionBrandTrack(true);
    }, 720);
  }
}

function startBrandAutoplay() {
  clearInterval(brandTimer);
  if (!document.hidden && !brandCarousel.matches(":hover") && !brandCarousel.contains(document.activeElement)) {
    brandTimer = setInterval(() => moveBrand(1), 2600);
  }
}

brandCarousel.querySelector(".brand-arrow-prev").addEventListener("click", () => {
  moveBrand(-1);
  startBrandAutoplay();
});
brandCarousel.querySelector(".brand-arrow-next").addEventListener("click", () => {
  moveBrand(1);
  startBrandAutoplay();
});
brandCarousel.addEventListener("mouseenter", () => clearInterval(brandTimer));
brandCarousel.addEventListener("mouseleave", startBrandAutoplay);
brandCarousel.addEventListener("focusin", () => clearInterval(brandTimer));
brandCarousel.addEventListener("focusout", startBrandAutoplay);
brandViewport.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveBrand(event.key === "ArrowRight" ? 1 : -1);
});
window.addEventListener("resize", () => positionBrandTrack(true));
document.addEventListener("visibilitychange", startBrandAutoplay);
positionBrandTrack(true);
startBrandAutoplay();

if (!heroAutoplay) {
  autoplayButton.setAttribute("aria-label", "Play slideshow");
  autoplayButton.classList.add("is-paused");
  autoplayButton.querySelector("path").setAttribute("d", "m8 5 11 7-11 7z");
}
startHeroAutoplay();

renderProducts();
updateCounts();

const categoryMenu = document.querySelector(".category-menu");
const categoryMenuToggle = categoryMenu.querySelector(".category-menu-toggle");
const canHoverCategories = window.matchMedia("(hover: hover) and (min-width: 651px)");
function setCategoryMenuOpen(open) {
  categoryMenu.classList.toggle("is-open", open);
  categoryMenuToggle.setAttribute("aria-expanded", String(open));
}
if (document.body.classList.contains("home-page")) {
  const heroCategories = document.querySelector(".hero-categories");
  const heroCategoriesToggle = heroCategories.querySelector(".hero-categories-toggle");
  categoryMenuToggle.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 650px)").matches) {
      heroCategories.classList.add("is-open");
      heroCategoriesToggle.setAttribute("aria-expanded", "true");
    }
    heroCategories.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  heroCategoriesToggle.addEventListener("click", () => {
    const open = heroCategories.classList.toggle("is-open");
    heroCategoriesToggle.setAttribute("aria-expanded", String(open));
  });
} else {
  categoryMenu.addEventListener("pointerenter", () => { if (canHoverCategories.matches) setCategoryMenuOpen(true); });
  categoryMenu.addEventListener("pointerleave", () => {
    if (canHoverCategories.matches && !categoryMenu.contains(document.activeElement)) setCategoryMenuOpen(false);
  });
  categoryMenu.addEventListener("focusin", () => setCategoryMenuOpen(true));
  categoryMenu.addEventListener("focusout", () => setTimeout(() => {
    if (!categoryMenu.contains(document.activeElement)) setCategoryMenuOpen(false);
  }, 0));
  categoryMenuToggle.addEventListener("click", () => {
    if (!canHoverCategories.matches) {
      const shouldOpen = !categoryMenu.classList.contains("is-open");
      setCategoryMenuOpen(shouldOpen);
      if (!shouldOpen) categoryMenuToggle.blur();
    } else setCategoryMenuOpen(true);
  });
  document.addEventListener("click", (event) => {
    if (!categoryMenu.contains(event.target)) setCategoryMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && categoryMenu.classList.contains("is-open")) {
      setCategoryMenuOpen(false);
      categoryMenuToggle.blur();
    }
  });
}

const homeReveals = document.querySelectorAll(".home-page main > section:not(.hero)");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const homeRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      homeRevealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
  homeReveals.forEach((section) => { section.classList.add("home-reveal"); homeRevealObserver.observe(section); });
}
