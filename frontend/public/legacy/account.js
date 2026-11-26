const apiBase = String(window.STORE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const backdrop = document.querySelector("#login-backdrop");
const drawer = document.querySelector("#login-drawer");
const defaultAvatar = "/legacy/account-avatar.svg";

function setupBrowseMenu(categories = []) {
  const oldLink = document.querySelector(".account-browse");
  if (!oldLink || oldLink.closest(".category-menu")) return;
  const menu = document.createElement("div"); menu.className = "category-menu account-category-menu";
  const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "category-menu-toggle account-browse";
  toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-controls", "account-category-dropdown");
  toggle.innerHTML = '<span class="browse-icon" aria-hidden="true">☰</span><span>Browse Collections</span><svg class="category-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m2 2 4 4 4-4" /></svg>';
  const dropdown = document.createElement("div"); dropdown.className = "category-menu-dropdown"; dropdown.id = "account-category-dropdown";
  toggle.querySelector(".browse-icon").textContent = "☰";
  toggle.querySelector("span:nth-child(2)").textContent = "Browse Categories";
  const names = categories.length ? categories : ["Furniture", "Outdoor Furniture", "Hotel Bar Furniture", "Coffee Shop Furniture", "Cafe Furniture", "Restaurant Furniture", "Hotel Dining Furniture", "Banquet & Event Chairs"];
  names.forEach((name) => {
    const link = document.createElement("a");
    link.href = name === "Furniture" ? "/furniture" : `/furniture?category=${encodeURIComponent(name)}`;
    const label = document.createElement("span"); label.textContent = name;
    link.append(label); dropdown.append(link);
  });
  menu.append(toggle, dropdown); oldLink.replaceWith(menu);
  const setOpen = (open) => { menu.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", String(open)); };
  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  menu.addEventListener("pointerenter", () => { if (matchMedia("(hover: hover) and (min-width: 651px)").matches) setOpen(true); });
  menu.addEventListener("pointerleave", () => { if (matchMedia("(hover: hover) and (min-width: 651px)").matches) setOpen(false); });
  menu.addEventListener("focusout", () => setTimeout(() => { if (!menu.contains(document.activeElement)) setOpen(false); }, 0));
  document.addEventListener("click", (event) => { if (!menu.contains(event.target)) setOpen(false); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { setOpen(false); toggle.focus(); } });
}

function setupAccountHero(site = {}) {
  const image = document.querySelector(".account-hero-background");
  if (!image) return;
  const source = typeof site.accountHeroBackgroundImage === "string" ? site.accountHeroBackgroundImage.trim() : "";
  if (!source || source.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(source) && !/^https:\/\//i.test(source)) return;
  image.src = source;
}

if (window.siteContentReady) window.siteContentReady.then((site) => {
  setupBrowseMenu(site?.categories || []);
  setupAccountHero(site || {});
});
else setupBrowseMenu();

function setFeedback(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle("success", success);
}

async function submitAuth(path, data) {
  let response;
  try {
    response = await fetch(`${apiBase}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch {
    throw new Error("Could not reach the server. Check that the backend is running on port 3001.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function openLogin() {
  backdrop.hidden = false;
  drawer.hidden = false;
  document.body.classList.add("drawer-open");
  window.setTimeout(() => drawer.querySelector('input[name="identifier"]')?.focus(), 30);
}

function closeLogin() {
  backdrop.hidden = true;
  drawer.hidden = true;
  document.body.classList.remove("drawer-open");
}

document.querySelectorAll("[data-open-login]").forEach((button) => button.addEventListener("click", openLogin));
document.querySelectorAll("[data-close-login]").forEach((button) => button.addEventListener("click", closeLogin));
backdrop.addEventListener("click", closeLogin);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !drawer.hidden) closeLogin();
});

document.querySelectorAll("[data-toggle-password]").forEach((button) => button.addEventListener("click", () => {
  const input = button.parentElement.querySelector("input");
  input.type = input.type === "password" ? "text" : "password";
  button.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
}));

document.querySelector("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector("#register-feedback");
  const button = form.querySelector('[type="submit"]');
  if (!form.reportValidity()) return;
  button.disabled = true;
  setFeedback(feedback, "");
  try {
    const result = await submitAuth("register", Object.fromEntries(new FormData(form)));
    setFeedback(feedback, result.message || "Your account is ready. Please sign in.", true);
    document.querySelector('#login-form [name="identifier"]').value = result.username || form.elements.username.value;
    form.reset();
    openLogin();
  } catch (error) {
    setFeedback(feedback, error.message);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector("#login-feedback");
  const button = form.querySelector('[type="submit"]');
  if (!form.reportValidity()) return;
  button.disabled = true;
  setFeedback(feedback, "");
  try {
    const result = await submitAuth("login", Object.fromEntries(new FormData(form)));
    window.localStorage.setItem("home_shape_customer", JSON.stringify({ token: result.token, username: result.username, email: result.email }));
    setFeedback(feedback, `Welcome back, ${result.username}.`, true);
    const requestedReturn = new URLSearchParams(window.location.search).get("returnTo");
    const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/account?view=dashboard";
    window.setTimeout(() => { window.location.href = returnTo; }, 350);
  } catch (error) {
    setFeedback(feedback, error.message);
  } finally {
    button.disabled = false;
  }
});

function readCustomerSession() {
  try { return JSON.parse(window.localStorage.getItem("home_shape_customer") || "null"); }
  catch { return null; }
}

async function customerRequest(path, options = {}) {
  const session = readCustomerSession();
  if (!session?.token) throw new Error("Please sign in to continue.");
  let response;
  try {
    response = await fetch(`${apiBase}/api/customer/${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${session.token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
    });
  } catch {
    throw new Error("Could not reach the server. Check that the backend is running on port 3001.");
  }
  const result = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.localStorage.removeItem("home_shape_customer");
    throw new Error("Your session expired. Please sign in again.");
  }
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function setCustomerFeedback(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle("success", success);
}

function setCustomerProfile(profile) {
  const session = readCustomerSession() || {};
  const updatedSession = { ...session, ...profile };
  window.localStorage.setItem("home_shape_customer", JSON.stringify(updatedSession));
  window.dispatchEvent(new CustomEvent("customer:updated", { detail: updatedSession }));
  const displayName = profile.fullName || profile.username || "there";
  document.querySelector("#welcome-name").textContent = displayName;
  document.querySelector("#sidebar-name").textContent = displayName;
  document.querySelector("#sidebar-email").textContent = profile.email || "";
  document.querySelector("#profile-username").value = profile.username || "";
  document.querySelector("#profile-email").value = profile.email || "";
  document.querySelector('#profile-form [name="fullName"]').value = profile.fullName || "";
  const image = profile.imageData || defaultAvatar;
  document.querySelector("#sidebar-avatar").src = image;
  document.querySelector("#profile-avatar").src = image;
}

function renderOrderList(container, orders) {
  container.replaceChildren();
  if (!orders.length) {
    const empty = document.createElement("div");
    empty.className = "customer-empty-orders";
    const title = document.createElement("strong");
    title.textContent = "No orders yet";
    const note = document.createElement("p");
    note.textContent = "Your order history will appear here after you place an order.";
    empty.append(title, note);
    container.append(empty);
    return;
  }
  orders.forEach((order) => {
    const row = document.createElement("article");
    row.className = "customer-order-row";
    const info = document.createElement("span");
    info.className = "customer-order-info";
    const number = document.createElement("strong");
    number.textContent = `Order ${order.number}`;
    const date = document.createElement("small");
    date.textContent = new Date(order.createdAt).toLocaleDateString();
    info.append(number, date);
    const total = document.createElement("span");
    total.className = "customer-order-total";
    total.textContent = `د.إ ${Number(order.total).toFixed(2)}`;
    const status = document.createElement("span");
    status.className = "customer-order-status";
    status.textContent = order.status || "processing";
    row.append(info, total, status);
    container.append(row);
  });
}

function showDashboardTab(tabName) {
  document.querySelectorAll("[data-dashboard-tab]").forEach((button) => button.classList.toggle("active", button.dataset.dashboardTab === tabName));
  document.querySelectorAll("[data-dashboard-panel]").forEach((panel) => {
    const active = panel.dataset.dashboardPanel === tabName;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
}

async function loadCustomerDashboard() {
  const session = readCustomerSession();
  if (!session?.token) return false;
  document.querySelector("#customer-dashboard").hidden = false;
  document.querySelector(".account-content").hidden = true;
  const requestedTab = new URLSearchParams(window.location.search).get("tab") || "overview";
  showDashboardTab(["overview", "orders", "addresses", "details", "security"].includes(requestedTab) ? requestedTab : "overview");
  try {
    const [profile, orders] = await Promise.all([customerRequest("profile"), customerRequest("orders")]);
    setCustomerProfile(profile);
    renderCustomerAddresses(profile.addresses || []);
    document.querySelector("#order-count").textContent = String(orders.length);
    renderOrderList(document.querySelector("#recent-orders"), orders.slice(0, 3));
    renderOrderList(document.querySelector("#customer-orders"), orders);
    return true;
  } catch (error) {
    if (!readCustomerSession()?.token) {
      document.querySelector("#customer-dashboard").hidden = true;
      document.querySelector(".account-content").hidden = false;
      openLogin();
      setCustomerFeedback(document.querySelector("#login-feedback"), error.message);
    } else {
      document.querySelector("#welcome-name").textContent = "there";
      const recent = document.querySelector("#recent-orders");
      recent.textContent = error.message;
    }
    return false;
  }
}

document.querySelectorAll("[data-dashboard-tab]").forEach((button) => button.addEventListener("click", () => showDashboardTab(button.dataset.dashboardTab)));

function renderCustomerAddresses(addresses) {
  const container = document.querySelector("#customer-addresses");
  if (!container) return;
  container.replaceChildren();
  if (!addresses.length) { const note = document.createElement("p"); note.className = "checkout-empty"; note.textContent = "No saved addresses yet."; container.append(note); return; }
  addresses.forEach((address) => {
    const card = document.createElement("article"); card.className = "saved-address";
    const heading = document.createElement("strong"); heading.textContent = `${address.label || "Address"}${address.isDefault ? " · Default" : ""}`;
    const detail = document.createElement("p"); detail.textContent = `${address.fullName} · ${address.phone}\n${address.street}, ${address.city}${address.region ? `, ${address.region}` : ""} ${address.postalCode || ""}, ${address.country}`;
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.addEventListener("click", async () => {
      try { const result = await customerRequest(`addresses/${encodeURIComponent(address._id)}`, { method: "DELETE" }); renderCustomerAddresses(result.addresses); }
      catch (error) { setCustomerFeedback(document.querySelector("#address-feedback"), error.message); }
    });
    card.append(heading, detail, remove); container.append(card);
  });
}

document.querySelector("#address-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget, feedback = document.querySelector("#address-feedback"), button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(form)); body.isDefault = form.elements.isDefault.checked;
    const result = await customerRequest("addresses", { method: "POST", body: JSON.stringify(body) });
    renderCustomerAddresses(result.addresses); form.reset(); setCustomerFeedback(feedback, "Address saved.", true);
  } catch (error) { setCustomerFeedback(feedback, error.message); }
  finally { button.disabled = false; }
});

document.querySelector("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#profile-feedback");
  const button = event.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const profile = await customerRequest("profile", { method: "PUT", body: JSON.stringify({ fullName: event.currentTarget.elements.fullName.value }) });
    setCustomerProfile(profile);
    setCustomerFeedback(feedback, "Your account details have been saved.", true);
  } catch (error) { setCustomerFeedback(feedback, error.message); }
  finally { button.disabled = false; }
});

document.querySelector("#avatar-upload").addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  const feedback = document.querySelector("#avatar-feedback");
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 1024 * 1024) {
    setCustomerFeedback(feedback, "Choose a JPG, PNG or WebP image smaller than 1 MB.");
    event.currentTarget.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const profile = await customerRequest("avatar", { method: "PUT", body: JSON.stringify({ imageData: reader.result }) });
      setCustomerProfile(profile);
      setCustomerFeedback(feedback, "Your profile photo has been updated.", true);
    } catch (error) { setCustomerFeedback(feedback, error.message); }
  };
  reader.onerror = () => setCustomerFeedback(feedback, "Could not read this image. Please try another.");
  reader.readAsDataURL(file);
});

document.querySelector("#remove-avatar").addEventListener("click", async () => {
  const feedback = document.querySelector("#avatar-feedback");
  try {
    const profile = await customerRequest("avatar", { method: "PUT", body: JSON.stringify({ imageData: "" }) });
    setCustomerProfile(profile);
    setCustomerFeedback(feedback, "Your profile photo has been removed.", true);
  } catch (error) { setCustomerFeedback(feedback, error.message); }
});

document.querySelector("#password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector("#password-feedback");
  if (form.elements.newPassword.value !== form.elements.confirmPassword.value) {
    setCustomerFeedback(feedback, "Your new passwords do not match.");
    return;
  }
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const result = await customerRequest("password", { method: "PUT", body: JSON.stringify({ currentPassword: form.elements.currentPassword.value, newPassword: form.elements.newPassword.value }) });
    form.reset();
    setCustomerFeedback(feedback, result.message, true);
  } catch (error) { setCustomerFeedback(feedback, error.message); }
  finally { button.disabled = false; }
});

document.querySelector("#customer-logout").addEventListener("click", () => {
  window.localStorage.removeItem("home_shape_customer");
  window.location.href = "/account";
});

loadCustomerDashboard();
if (new URLSearchParams(window.location.search).get("login") === "1" && !readCustomerSession()?.token) openLogin();
const activationToken = new URLSearchParams(window.location.search).get("activation");
if (activationToken) {
  submitAuth("activate", { token: activationToken }).then((result) => {
    window.history.replaceState({}, "", "/account");
    openLogin();
    setFeedback(document.querySelector("#login-feedback"), result.message, true);
  }).catch((error) => {
    window.history.replaceState({}, "", "/account");
    setFeedback(document.querySelector("#register-feedback"), error.message);
  });
}
