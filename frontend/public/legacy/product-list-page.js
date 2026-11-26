(() => {
  const lists = window.HomeShapeLists;
  const type = document.body.classList.contains("wishlist-page") ? "wishlist" : "compare";
  const host = document.querySelector("#product-list-content");
  const title = document.querySelector("[data-list-title]");
  const description = document.querySelector("[data-list-description]");
  if (!lists || !host) return;

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const money = (value) => `د.إ ${Number(value || 0).toFixed(2)}`;
  const shopLink = '<a class="product-list-shop-link" href="/furniture">Return to shop</a>';

  function addToBag(product) {
    try {
      const items = JSON.parse(localStorage.getItem("home_shape_checkout_cart") || "[]");
      const cart = Array.isArray(items) ? items : [];
      const existing = cart.find((item) => String(item.id) === String(product.id));
      if (existing) existing.quantity = Math.max(1, Number(existing.quantity) || 1) + 1;
      else cart.push({ id: product.id, quantity: 1 });
      localStorage.setItem("home_shape_checkout_cart", JSON.stringify(cart));
      return true;
    } catch { return false; }
  }

  function emptyState() {
    const isWishlist = type === "wishlist";
    const icon = isWishlist
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 8.7c0 5.2-8.7 10.1-8.7 10.1S3.3 13.9 3.3 8.7a4.5 4.5 0 0 1 8.7-1.6 4.5 4.5 0 0 1 8.7 1.6Z" /></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v18m0 0-4-4m4 4 4-4M17 21V3m0 0-4 4m4-4 4 4" /></svg>';
    host.innerHTML = `<div class="product-list-empty"><span class="product-list-empty-icon">${icon}</span><h2>${isWishlist ? "Your wishlist is empty." : "Your compare list is empty."}</h2><p>${isWishlist ? 'Save the pieces you love with the heart button and they’ll be waiting here.' : 'Add products to compare their details side by side.'}</p>${shopLink}</div>`;
  }

  function renderWishlist(items) {
    host.innerHTML = `<div class="product-list-toolbar"><span>${items.length} ${items.length === 1 ? "saved piece" : "saved pieces"}</span><button type="button" data-clear-list>Clear wishlist</button></div><div class="wishlist-product-grid">${items.map((item) => `
      <article class="wishlist-product-card">
        <div class="wishlist-product-image"><a href="/product?id=${encodeURIComponent(item.id)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" /></a><button class="wishlist-product-remove" type="button" data-list-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)} from wishlist">×</button></div>
        <div class="wishlist-product-copy"><p class="wishlist-product-meta"><span>${escapeHtml(item.category)}</span><span>${item.stock ? "In stock" : "Out of stock"}</span></p><h2><a href="/product?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a></h2><strong class="wishlist-product-price">${money(item.price)}</strong>
          <div class="wishlist-product-actions"><button class="product-list-action" type="button" data-list-add="${escapeHtml(item.id)}" ${item.stock ? "" : "disabled"}>Add to bag</button><button class="product-list-action product-list-secondary" type="button" data-move-compare="${escapeHtml(item.id)}">Compare</button></div>
        </div>
      </article>`).join("")}</div><p class="product-list-feedback" role="status" aria-live="polite"></p>`;
  }

  function renderCompare(items) {
    const head = items.map((item) => `<th scope="col"><a class="compare-product-image" href="/product?id=${encodeURIComponent(item.id)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" /></a><a class="compare-product-name" href="/product?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a><br /><button class="compare-product-remove" type="button" data-list-remove="${escapeHtml(item.id)}">Remove</button></th>`).join("");
    const row = (label, value) => `<tr><th scope="row">${label}</th>${items.map((item) => `<td>${value(item)}</td>`).join("")}</tr>`;
    host.innerHTML = `<div class="product-list-toolbar"><span>${items.length} ${items.length === 1 ? "product" : "products"} to compare</span><button type="button" data-clear-list>Clear comparison</button></div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th scope="col">Product</th>${head}</tr></thead><tbody>
      ${row("Price", (item) => `<span class="compare-price">${money(item.price)}</span>${item.oldPrice ? `<br /><del>${money(item.oldPrice)}</del>` : ""}`)}
      ${row("Description", (item) => `<span class="compare-description">${escapeHtml(item.description || "Thoughtfully selected for your home.")}</span>`)}
      ${row("Category", (item) => escapeHtml(item.category))}
      ${row("Brand", (item) => escapeHtml(item.brand))}
      ${row("Customer rating", (item) => item.reviewCount ? `${item.rating.toFixed(1)} / 5 (${item.reviewCount} reviews)` : "No reviews yet")}
      ${row("Availability", (item) => item.stock ? "In stock" : "Out of stock")}
      ${row("Actions", (item) => `<div class="compare-actions"><button class="product-list-action" type="button" data-list-add="${escapeHtml(item.id)}" ${item.stock ? "" : "disabled"}>Add to bag</button><button class="product-list-action product-list-secondary" type="button" data-move-wishlist="${escapeHtml(item.id)}">Add to wishlist</button></div>`)}</tbody></table></div><p class="product-list-feedback" role="status" aria-live="polite"></p>`;
  }

  function render() {
    const items = lists.get(type);
    if (title) title.textContent = type === "wishlist" ? "Wishlist" : "Compare products";
    if (description) description.textContent = type === "wishlist" ? "Your saved pieces, all in one place." : "See your selected pieces side by side.";
    if (!items.length) { emptyState(); return; }
    if (type === "wishlist") renderWishlist(items);
    else renderCompare(items);
  }

  host.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-list-remove]");
    const clear = event.target.closest("[data-clear-list]");
    const add = event.target.closest("[data-list-add]");
    const move = event.target.closest("[data-move-compare],[data-move-wishlist]");
    if (remove) { lists.remove(type, remove.dataset.listRemove); render(); }
    if (clear) { lists.clear(type); render(); }
    if (add) {
      const item = lists.get(type).find((product) => String(product.id) === String(add.dataset.listAdd));
      const feedback = host.querySelector(".product-list-feedback");
      if (item && addToBag(item) && feedback) {
        feedback.replaceChildren(document.createTextNode(`${item.name} added to your bag. `));
        const checkout = document.createElement("a");
        checkout.href = "/checkout";
        checkout.textContent = "Go to checkout";
        feedback.append(checkout);
      }
    }
    if (move) {
      const targetType = move.hasAttribute("data-move-compare") ? "compare" : "wishlist";
      const item = lists.get(type).find((product) => String(product.id) === String(move.dataset[targetType === "compare" ? "moveCompare" : "moveWishlist"]));
      if (item) lists.add(targetType, item);
      render();
    }
  });

  window.addEventListener("product-lists:updated", render);
  render();
})();
