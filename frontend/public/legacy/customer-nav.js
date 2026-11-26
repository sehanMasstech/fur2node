(() => {
  const apiBase = String(window.STORE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
  const avatarFallback = "/legacy/account-avatar.svg";

  function setupListLinks() {
    const actions = document.querySelectorAll(".site-header .header-actions");
    actions.forEach((group) => {
      [
        { key: "wishlist", label: "Wishlist", href: "/wishlist", path: "M20.7 8.7c0 5.2-8.7 10.1-8.7 10.1S3.3 13.9 3.3 8.7a4.5 4.5 0 0 1 8.7-1.6 4.5 4.5 0 0 1 8.7 1.6Z" },
        { key: "compare", label: "Compare", href: "/compare", path: "M7 3v18m0 0-4-4m4 4 4-4M17 21V3m0 0-4 4m4-4 4 4" }
      ].forEach(({ key, label, href, path }) => {
        const className = `${key}-header`;
        let link = group.querySelector(`.${className}`);
        if (link?.tagName === "BUTTON") {
          const anchor = document.createElement("a");
          anchor.className = link.className;
          anchor.innerHTML = link.innerHTML;
          anchor.setAttribute("aria-label", label);
          link.replaceWith(anchor);
          link = anchor;
        }
        if (!link) {
          link = document.createElement("a");
          link.className = `icon-button ${className}`;
          link.setAttribute("aria-label", label);
          link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" /></svg><span class="header-count ${key}-count">0</span>`;
          const cart = group.querySelector(".cart-toggle");
          if (cart) group.insertBefore(link, cart);
          else group.append(link);
        }
        link.href = href;
        link.setAttribute("aria-label", label);
        let count = link.querySelector(".header-count");
        if (!count) { count = document.createElement("span"); count.className = "header-count"; link.append(count); }
        count.classList.add(`${key}-count`);
      });
    });
  }
  setupListLinks();

  if (document.querySelector(".site-header")) {
    let backToTop = document.querySelector(".back-to-top");
    if (!backToTop) {
      backToTop = document.createElement("button");
      backToTop.className = "back-to-top"; backToTop.type = "button";
      backToTop.setAttribute("aria-label", "Back to top");
      backToTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>';
      document.body.append(backToTop);
    }
    const updateBackToTop = () => {
      const visible = window.scrollY > 320;
      backToTop.classList.toggle("is-visible", visible);
      backToTop.setAttribute("aria-hidden", String(!visible));
      backToTop.tabIndex = visible ? 0 : -1;
    };
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    updateBackToTop();
  }

  function readSession() {
    try { return JSON.parse(window.localStorage.getItem("home_shape_customer") || "null"); }
    catch { return null; }
  }

  function paintAccountLinks(profile) {
    document.querySelectorAll(".account-link").forEach((link) => {
      if (!profile) {
        link.classList.remove("customer-signed-in");
        link.href = "/account?login=1";
        link.removeAttribute("title");
        link.setAttribute("aria-label", "Login or register");
        link.innerHTML = "<span>Login / Register</span>";
        return;
      }
      const name = profile.fullName || profile.username || "My account";
      link.classList.add("customer-signed-in");
      link.href = "/account#dashboard";
      link.title = name;
      link.setAttribute("aria-label", `${name} account`);
      const avatar = profile.imageData || avatarFallback;
      link.innerHTML = `<img class="customer-nav-avatar" src="${avatar}" alt="" /><span class="customer-nav-label">${name.replace(/[&<>"']/g, "")}</span>`;
    });
  }

  window.addEventListener("customer:updated", (event) => paintAccountLinks(event.detail || readSession()));

  const session = readSession();
  if (!session?.token) {
    paintAccountLinks(null);
    return;
  }
  paintAccountLinks(session);
  fetch(`${apiBase}/api/customer/profile`, { headers: { Authorization: `Bearer ${session.token}` } })
    .then((response) => {
      if (response.status === 401 || response.status === 404) {
        window.localStorage.removeItem("home_shape_customer");
        paintAccountLinks(null);
        return null;
      }
      return response.ok ? response.json() : null;
    })
    .then((profile) => {
      if (!profile) return;
      window.localStorage.setItem("home_shape_customer", JSON.stringify({ ...session, ...profile }));
      paintAccountLinks(profile);
    })
    .catch(() => {});
})();
