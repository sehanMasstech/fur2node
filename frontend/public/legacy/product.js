const productImages = [...document.querySelectorAll(".gallery-thumb")];
const mainProductImage = document.querySelector("#gallery-main-image");
let activeProduct = { id: Number(new URLSearchParams(window.location.search).get("id")) || 1, name: "Nerd wooden chair", price: 599, image: mainProductImage.src };
let productReviews = [];
async function loadCurrentProduct() {
  try {
    const response = await fetch(window.storeApiUrl("products"));
    if (!response.ok) return;
    const products = await response.json();
    const requestedId = new URLSearchParams(window.location.search).get("id");
    const product = requestedId ? products.find((item) => String(item.id) === requestedId) : products[0];
    if (!product) return;
    activeProduct = { id: product.id, name: product.name, price: Number(product.price), image: product.image };
    document.querySelector(".detail-icon-action").dataset.wishlist = String(product.id);
    document.querySelector(".detail-compare-action").dataset.compare = String(product.id);
    window.HomeShapeLists.refresh();
    loadProductReviews(product.id, product.name);
    document.querySelector("#product-title").textContent = product.name;
    document.title = `${product.name} | Home Shape`;
    document.querySelector(".detail-price strong").textContent = `د.إ ${Number(product.price).toFixed(2)}`;
    const oldPrice = document.querySelector(".detail-price del");
    oldPrice.hidden = !product.oldPrice;
    if (product.oldPrice) oldPrice.textContent = `د.إ ${Number(product.oldPrice).toFixed(2)}`;
    document.querySelector(".detail-description").textContent = product.description;
    const expandedDescription = document.querySelector(".product-copy-column > p");
    const detailHeading = document.querySelector("#detail-section-heading");
    if (detailHeading) detailHeading.textContent = product.detailHeading || "Designed for modern living";
    const featureList = document.querySelector("#product-benefits");
    if (featureList && Array.isArray(product.features) && product.features.length) {
      featureList.replaceChildren(...product.features.map((feature) => {
        const item = document.createElement("li");
        item.textContent = feature;
        return item;
      }));
    }
    if (expandedDescription) expandedDescription.textContent = product.detailDescription || product.description;
    const detailImages = Array.isArray(product.detailImages) ? product.detailImages : [];
    document.querySelectorAll("[data-product-detail-image]").forEach((image, index) => {
      if (detailImages[index]) image.src = detailImages[index];
      image.alt = `${product.name} detail ${index + 1}`;
    });
    document.querySelector("#gallery-main-image").src = product.image;
    document.querySelector("#gallery-main-image").alt = product.name;
    document.querySelectorAll(".gallery-thumb").forEach((thumb, index) => {
      const image = index === 1 && product.hoverImage ? product.hoverImage : product.image;
      thumb.dataset.image = image;
      thumb.dataset.alt = product.name;
      thumb.querySelector("img").src = image;
      thumb.setAttribute("aria-label", `View ${product.name}`);
    });
    const badge = document.querySelector(".detail-sale-badge");
    badge.hidden = !product.badge;
    badge.textContent = product.badge || "";
    document.querySelectorAll(".review-list-toolbar h3").forEach((heading) => { heading.textContent = `Reviews for ${product.name}`; });
    const relatedProducts = products.filter((item) => String(item.id) !== String(product.id)).slice(0, 4);
    const relatedGrid = document.querySelector(".related-product-grid");
    if (relatedGrid && relatedProducts.length) {
      relatedGrid.innerHTML = relatedProducts.map((item) => `<a href="/product?id=${encodeURIComponent(item.id)}" class="related-card"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"/><span>${escapeHtml(item.category || "Furniture")}</span><h3>${escapeHtml(item.name)}</h3><strong>${item.oldPrice ? `<del>د.إ ${Number(item.oldPrice).toFixed(2)}</del> ` : ""}د.إ ${Number(item.price).toFixed(2)}</strong></a>`).join("");
    }
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const colorVariants = Array.isArray(product.colorVariants) ? product.colorVariants : [];
    const swatches = document.querySelector(".detail-swatches");
    const variation = document.querySelector(".detail-variation");
    variation.hidden = colors.length === 0;
    swatches.replaceChildren(...colors.map((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `detail-swatch${index === 0 ? " is-selected" : ""}`;
      button.setAttribute("aria-label", color);
      button.setAttribute("title", color);
      button.setAttribute("aria-pressed", String(index === 0));
      button.dataset.color = color;
      const variant = colorVariants.find((item) => item.color?.toLowerCase() === color.toLowerCase());
      button.dataset.image = variant?.image || product.image;
      button.dataset.alt = `${product.name} in ${color}`;
      button.style.backgroundColor = CSS.supports("color", color) ? color : ["#9b7956", "#343a35", "#879781", "#9c9b91"][index % 4];
      return button;
    }));
    colorChoices = [...swatches.querySelectorAll(".detail-swatch")];
    colorLabel.textContent = colors[0] || "—";
    const colorSpec = document.querySelector(".product-spec-table span");
    if (colorSpec) colorSpec.textContent = colors.join(", ");
    const category = document.createElement("a");
    category.href = `/furniture?category=${encodeURIComponent(product.category)}`;
    category.textContent = product.category;
    const meta = document.querySelector(".detail-meta");
    meta.replaceChildren();
    const skuLabel = document.createElement("span");
    skuLabel.textContent = "SKU:";
    const categoryLabel = document.createElement("span");
    categoryLabel.textContent = "Category:";
    meta.append(skuLabel, document.createTextNode(` ${product.id} `), categoryLabel, document.createTextNode(" "), category);
  } catch (error) {
    console.warn("The live product details could not be loaded; showing the saved product details.", error);
  }
}
if (window.siteContentReady) window.siteContentReady.then(loadCurrentProduct);
else window.addEventListener("cms:loaded", loadCurrentProduct, { once: true });
function selectProductImage(button) {
  mainProductImage.style.opacity = "0.35";
  setTimeout(() => {
    mainProductImage.src = button.dataset.image;
    mainProductImage.alt = button.dataset.alt;
    mainProductImage.style.opacity = "1";
  }, 120);
  productImages.forEach((thumb) => {
    const selected = thumb === button;
    thumb.classList.toggle("is-selected", selected);
    thumb.setAttribute("aria-pressed", String(selected));
  });
}
productImages.forEach((button) => button.addEventListener("click", () => selectProductImage(button)));

let colorChoices = [...document.querySelectorAll(".detail-swatch")];
const colorLabel = document.querySelector(".selected-color-name");
function chooseColor(button) {
  colorChoices.forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle("is-selected", selected);
    choice.setAttribute("aria-pressed", String(selected));
  });
  colorLabel.textContent = button.dataset.color;
  activeProduct.image = button.dataset.image || activeProduct.image;
  const matchingThumb = productImages.find((thumb) => thumb.dataset.image === button.dataset.image);
  if (matchingThumb) selectProductImage(matchingThumb);
  else {
    mainProductImage.src = button.dataset.image;
    mainProductImage.alt = button.dataset.alt || `${activeProduct.name} in ${button.dataset.color.toLowerCase()}`;
    productImages.forEach((thumb) => { thumb.classList.remove("is-selected"); thumb.setAttribute("aria-pressed", "false"); });
  }
}
document.querySelector(".detail-swatches").addEventListener("click", (event) => {
  const button = event.target.closest(".detail-swatch");
  if (button) chooseColor(button);
});
document.querySelector(".clear-variation").addEventListener("click", () => chooseColor(colorChoices[0]));

const quantityOutput = document.querySelector("#product-quantity");
document.querySelectorAll("[data-quantity-step]").forEach((button) => button.addEventListener("click", () => {
  quantityOutput.value = String(Math.max(1, Number(quantityOutput.value || quantityOutput.textContent) + Number(button.dataset.quantityStep)));
  quantityOutput.textContent = quantityOutput.value;
}));

const toast = document.querySelector(".toast");
let toastTimer;
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
function announce(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}
const productCart = { count: 0, total: 0, quantity: 0 };
function refreshCart() {
  document.querySelectorAll(".cart-count").forEach((node) => node.textContent = String(productCart.count));
  document.querySelector(".cart-total").textContent = `د.إ ${productCart.total.toFixed(2)}`;
  document.querySelector(".drawer-count").textContent = `(${productCart.count})`;
  document.querySelector(".subtotal-row strong").textContent = `د.إ ${productCart.total.toFixed(2)}`;
  document.querySelector(".cart-empty").hidden = productCart.count > 0;
  document.querySelector(".cart-summary").hidden = productCart.count === 0;
  document.querySelector(".cart-items").innerHTML = productCart.count ? `<div class="cart-line"><img src="${escapeHtml(activeProduct.image)}" alt="${escapeHtml(activeProduct.name)}"/><div><h3>${escapeHtml(activeProduct.name)}</h3><p>د.إ ${activeProduct.price.toFixed(2)}</p><div class="quantity-control"><button type="button" data-cart-step="-1" aria-label="Decrease quantity">−</button><span>${productCart.count}</span><button type="button" data-cart-step="1" aria-label="Increase quantity">+</button></div></div><button class="remove-item" type="button" data-cart-remove>Remove</button></div>` : "";
}
function openCart() {
  const backdrop = document.querySelector(".drawer-backdrop");
  backdrop.hidden = false;
  refreshCart();
  requestAnimationFrame(() => { backdrop.classList.add("visible"); document.querySelector(".cart-drawer").classList.add("open"); });
  document.querySelector(".cart-drawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  document.querySelector(".cart-drawer").classList.remove("open");
  document.querySelector(".drawer-backdrop").classList.remove("visible");
  document.querySelector(".drawer-backdrop").hidden = true;
  document.querySelector(".cart-drawer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
document.querySelector(".detail-add-to-cart").addEventListener("click", () => {
  const quantity = Math.max(1, Number(quantityOutput.value || quantityOutput.textContent));
  productCart.count += quantity;
  productCart.quantity += quantity;
  productCart.total = productCart.count * activeProduct.price;
  productCart.id = activeProduct.id;
  refreshCart();
  announce(`Nerd wooden chair added to your bag`);
});
document.querySelector(".cart-toggle").addEventListener("click", openCart);
document.querySelector(".drawer-close").addEventListener("click", closeCart);
document.querySelector(".continue-shopping").addEventListener("click", closeCart);
document.querySelector(".drawer-backdrop").addEventListener("click", closeCart);
document.querySelector(".checkout-button").addEventListener("click", () => { if (!productCart.id || !productCart.count) return announce("Add a product to your bag first."); localStorage.setItem("home_shape_checkout_cart", JSON.stringify([{ id: productCart.id, quantity: productCart.count }])); window.location.href = "/checkout"; });
document.querySelector(".cart-items").addEventListener("click", (event) => {
  if (event.target.closest("[data-cart-remove]")) { productCart.count = 0; productCart.total = 0; }
  const step = event.target.closest("[data-cart-step]");
  if (step) { productCart.count = Math.max(0, productCart.count + Number(step.dataset.cartStep)); productCart.total = productCart.count * activeProduct.price; }
  refreshCart();
});
document.querySelector(".detail-icon-action").addEventListener("click", (event) => {
  const selected = window.HomeShapeLists.toggle("wishlist", activeProduct);
  event.currentTarget.classList.toggle("is-selected", selected);
  event.currentTarget.querySelector(".wishlist-symbol").textContent = selected ? "♥" : "♡";
  announce(selected ? "Saved to your wishlist" : "Removed from your wishlist");
});
document.querySelector(".detail-compare-action").addEventListener("click", (event) => {
  const selected = window.HomeShapeLists.toggle("compare", activeProduct);
  event.currentTarget.classList.toggle("is-selected", selected);
  announce(selected ? "Added to compare" : "Removed from compare");
});

document.querySelector(".gallery-zoom").addEventListener("click", () => {
  const overlay = document.querySelector(".product-image-lightbox");
  overlay.querySelector("img").src = mainProductImage.src;
  overlay.querySelector("img").alt = mainProductImage.alt;
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
});
const lightbox = document.querySelector(".product-image-lightbox");
function closeLightbox() { lightbox.classList.remove("is-open"); lightbox.setAttribute("aria-hidden", "true"); if (!document.querySelector(".cart-drawer").classList.contains("open")) document.body.style.overflow = ""; }
lightbox.addEventListener("click", (event) => { if (event.target === lightbox || event.target.closest("button")) closeLightbox(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeLightbox(); closeCart(); } });

function formatReviewStars(rating) { return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`; }
function renderProductReviews(summary = {}) {
  const list = document.querySelector("#customer-reviews-list");
  const heading = document.querySelector("#review-list-heading");
  const count = Number(summary.count) || 0;
  document.querySelector("#reviews-based-on").textContent = count ? `Based on ${count} verified ${count === 1 ? "review" : "reviews"}` : "No approved reviews yet.";
  document.querySelector("#reviews-average").textContent = count ? Number(summary.average).toFixed(2) : "—";
  document.querySelector("#reviews-average-stars").textContent = count ? formatReviewStars(Math.round(summary.average)) : "☆☆☆☆☆";
  document.querySelector(".detail-rating-text").textContent = count ? `Rated ${Number(summary.average).toFixed(2)} out of 5 based on ${count} verified customer ${count === 1 ? "review" : "reviews"}` : "No approved customer reviews yet";
  document.querySelector(".detail-rating > a").textContent = `(${count} customer ${count === 1 ? "review" : "reviews"})`;
  document.querySelector(".detail-rating > span:first-child").textContent = count ? formatReviewStars(Math.round(summary.average)) : "☆☆☆☆☆";
  document.querySelector(".detail-rating > span:first-child").setAttribute("aria-label", count ? `${Number(summary.average).toFixed(2)} out of 5 stars` : "No customer ratings yet");
  heading.textContent = `${count} ${count === 1 ? "review" : "reviews"} for ${activeProduct.name}`;
  document.querySelector("#product-reviews-tab").textContent = `Reviews (${count})`;
  const total = count || 1;
  const bars = document.querySelector("#reviews-bars"); bars.replaceChildren();
  (summary.distribution || []).slice().reverse().forEach((entry) => {
    const row = document.createElement("div"); const label = document.createElement("span"); label.textContent = `${entry.rating} stars`;
    const track = document.createElement("i"); const fill = document.createElement("b"); fill.style.setProperty("--rating", `${Number(entry.count) / total * 100}%`); track.append(fill);
    const value = document.createElement("span"); value.textContent = String(entry.count); row.append(label, track, value); bars.append(row);
  });
  const sort = document.querySelector("#review-sort").value;
  const sorted = [...productReviews].sort((a, b) => sort === "oldest" ? new Date(a.createdAt) - new Date(b.createdAt) : sort === "highest" ? b.rating - a.rating : new Date(b.createdAt) - new Date(a.createdAt));
  list.replaceChildren();
  if (!sorted.length) { const empty = document.createElement("p"); empty.className = "reviews-empty"; empty.textContent = "There are no approved customer reviews for this product yet."; list.append(empty); return; }
  sorted.forEach((review) => {
    const card = document.createElement("article"); card.className = "customer-review";
    const header = document.createElement("div"); const name = document.createElement("strong"); name.textContent = review.customerName;
    const time = document.createElement("time"); time.dateTime = review.createdAt; time.textContent = new Date(review.createdAt).toLocaleDateString();
    const stars = document.createElement("span"); stars.textContent = formatReviewStars(review.rating); stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
    const verified = document.createElement("small"); verified.className = "review-verified"; verified.textContent = review.verifiedPurchase ? "Verified purchase" : "Customer review";
    header.append(name, time, stars, verified); const comment = document.createElement("p"); comment.textContent = review.comment; card.append(header, comment);
    if (review.reply) { const reply = document.createElement("div"); reply.className = "store-review-reply"; const replyTitle = document.createElement("strong"); replyTitle.textContent = `Reply from ${review.reply.displayName}`; const replyText = document.createElement("p"); replyText.textContent = review.reply.comment; reply.append(replyTitle, replyText); card.append(reply); }
    list.append(card);
  });
}
async function loadProductReviews(productId, productName) {
  activeProduct.id = Number(productId); activeProduct.name = productName || activeProduct.name;
  try {
    const apiBase = String(window.STORE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
    const response = await fetch(`${apiBase}/api/products/${encodeURIComponent(productId)}/reviews`, { cache: "no-store" });
    const summary = response.ok ? await response.json() : { count: 0, reviews: [], distribution: [] };
    productReviews = Array.isArray(summary.reviews) ? summary.reviews : [];
    renderProductReviews(summary);
  } catch {
    productReviews = []; renderProductReviews({ count: 0, reviews: [], distribution: [] });
    document.querySelector("#reviews-based-on").textContent = "Customer reviews could not be loaded. Please try again.";
  }
}
document.querySelector("#review-sort").addEventListener("change", () => renderProductReviews({ count: productReviews.length, average: productReviews.reduce((sum, item) => sum + item.rating, 0) / (productReviews.length || 1), reviews: productReviews, distribution: [1,2,3,4,5].map((rating) => ({ rating, count: productReviews.filter((item) => item.rating === rating).length })) }));
document.querySelector("#customer-review-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const feedback = document.querySelector("#review-feedback");
  let session; try { session = JSON.parse(localStorage.getItem("home_shape_customer") || "null"); } catch { session = null; }
  if (!session?.token) { const returnTo = `${window.location.pathname}${window.location.search}#product-reviews`; window.location.href = `/account?login=1&returnTo=${encodeURIComponent(returnTo)}`; return; }
  const button = form.querySelector("button[type=submit]"); button.disabled = true; feedback.textContent = "";
  try {
    const apiBase = String(window.STORE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
    const response = await fetch(`${apiBase}/api/customer/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ productId: activeProduct.id, rating: Number(form.elements.rating.value), comment: form.elements.comment.value }) });
    const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "Your review could not be saved.");
    feedback.textContent = result.message; feedback.classList.add("success"); form.reset();
  } catch (error) { feedback.textContent = error.message; feedback.classList.remove("success"); }
  finally { button.disabled = false; }
});
document.querySelector(".header-search-form").addEventListener("submit", (event) => { event.preventDefault(); window.location.href = `furniture.html?search=${encodeURIComponent(event.currentTarget.querySelector('input[type="search"]').value)}`; });
document.querySelector(".mobile-menu-button").addEventListener("click", (event) => {
  const nav = document.querySelector(".main-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

const categoryMenu = document.querySelector(".category-menu");
const categoryMenuToggle = categoryMenu.querySelector(".category-menu-toggle");
const canHoverCategories = window.matchMedia("(hover: hover) and (min-width: 651px)");
function setCategoryMenuOpen(open) { categoryMenu.classList.toggle("is-open", open); categoryMenuToggle.setAttribute("aria-expanded", String(open)); }
categoryMenu.addEventListener("pointerenter", () => { if (canHoverCategories.matches) setCategoryMenuOpen(true); });
categoryMenu.addEventListener("pointerleave", () => { if (canHoverCategories.matches && !categoryMenu.contains(document.activeElement)) setCategoryMenuOpen(false); });
categoryMenu.addEventListener("focusin", () => setCategoryMenuOpen(true));
categoryMenu.addEventListener("focusout", () => setTimeout(() => { if (!categoryMenu.contains(document.activeElement)) setCategoryMenuOpen(false); }, 0));
categoryMenuToggle.addEventListener("click", () => {
  if (!canHoverCategories.matches) { const open = !categoryMenu.classList.contains("is-open"); setCategoryMenuOpen(open); if (!open) categoryMenuToggle.blur(); }
  else setCategoryMenuOpen(true);
});
document.addEventListener("click", (event) => { if (!categoryMenu.contains(event.target)) setCategoryMenuOpen(false); });

const revealTargets = document.querySelectorAll("[data-reveal]");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-revealed", entry.isIntersecting)), { threshold: .1, rootMargin: "0px 0px -5% 0px" });
  revealTargets.forEach((target) => { target.classList.add("product-reveal"); observer.observe(target); });
} else revealTargets.forEach((target) => target.classList.add("is-revealed"));

const sectionLinks = [...document.querySelectorAll(".product-detail-tabs a")];
const detailSections = sectionLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const tabObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) sectionLinks.forEach((link) => link.classList.toggle("is-active", link.hash === `#${entry.target.id}`));
  }), { rootMargin: "-20% 0px -70% 0px" });
  detailSections.forEach((section) => tabObserver.observe(section));
}
refreshCart();
