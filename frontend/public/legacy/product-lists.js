(() => {
  const storageKeys = { wishlist: "home_shape_wishlist", compare: "home_shape_compare" };

  function read(type) {
    try {
      const value = JSON.parse(localStorage.getItem(storageKeys[type]) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && item.id != null) : [];
    } catch { return []; }
  }

  function write(type, items) {
    localStorage.setItem(storageKeys[type], JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("product-lists:updated", { detail: { type } }));
    refresh();
  }

  function normalize(product) {
    return {
      id: String(product.id),
      name: String(product.name || "Product"),
      image: String(product.image || ""),
      hoverImage: String(product.hoverImage || ""),
      price: Number(product.price) || 0,
      oldPrice: Number(product.oldPrice ?? product.old) || 0,
      category: String(product.category || "Furniture"),
      brand: String(product.brand || "Home Shape"),
      description: String(product.description || ""),
      rating: Number(product.rating) || 0,
      reviewCount: Number(product.reviewCount) || 0,
      stock: product.stock !== false && product.inStock !== false
    };
  }

  function get(type) { return read(type); }
  function has(type, id) { return read(type).some((item) => String(item.id) === String(id)); }
  function add(type, product) {
    const item = normalize(product);
    if (has(type, item.id)) return false;
    write(type, [...read(type), item]);
    return true;
  }
  function remove(type, id) {
    write(type, read(type).filter((item) => String(item.id) !== String(id)));
  }
  function clear(type) { write(type, []); }
  function toggle(type, product) {
    if (has(type, product.id)) { remove(type, product.id); return false; }
    add(type, product);
    return true;
  }

  function refresh() {
    const wishlist = read("wishlist");
    const compare = read("compare");
    document.querySelectorAll(".wishlist-count").forEach((node) => { node.textContent = String(wishlist.length); });
    document.querySelectorAll(".compare-count").forEach((node) => { node.textContent = String(compare.length); });
    document.querySelectorAll("[data-wishlist]").forEach((button) => {
      const selected = has("wishlist", button.dataset.wishlist);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", selected ? "Remove from wishlist" : "Add to wishlist");
    });
    document.querySelectorAll("[data-compare]").forEach((button) => {
      const selected = has("compare", button.dataset.compare);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", selected ? "Remove from compare" : "Add to compare");
    });
  }

  window.HomeShapeLists = { get, has, add, remove, clear, toggle, refresh };
  window.addEventListener("product-lists:updated", refresh);
  window.addEventListener("storage", refresh);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, { once: true });
  else refresh();
})();
