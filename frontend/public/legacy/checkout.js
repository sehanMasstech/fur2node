const checkoutApi = String(window.STORE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const checkoutSession = (() => { try { return JSON.parse(localStorage.getItem("home_shape_customer") || "null"); } catch { return null; } })();
let checkoutCart = [];
let checkoutAddresses = [];
const checkoutFeedback = document.querySelector("#checkout-feedback");
function checkoutMessage(message, success = false) { checkoutFeedback.textContent = message; checkoutFeedback.classList.toggle("success", success); }
async function checkoutRequest(path, options = {}) {
  const response = await fetch(`${checkoutApi}/api/${path}`, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(checkoutSession?.token ? { Authorization: `Bearer ${checkoutSession.token}` } : {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not load checkout.");
  return data;
}
function displayMoney(value) { return `د.إ ${Number(value).toFixed(2)}`; }
function renderCheckoutItems(products) {
  const entries = checkoutCart.map((line) => ({ product: products.find((product) => Number(product.id) === Number(line.id)), quantity: Number(line.quantity) })).filter((line) => line.product);
  const container = document.querySelector("#checkout-items");
  container.replaceChildren();
  let total = 0;
  entries.forEach(({ product, quantity }) => {
    total += Number(product.price) * quantity;
    const row = document.createElement("div"); row.className = "checkout-line";
    const title = document.createElement("span"); title.textContent = `${product.name} × ${quantity}`;
    const price = document.createElement("strong"); price.textContent = displayMoney(product.price * quantity);
    row.append(title, price); container.append(row);
  });
  if (!entries.length) { const empty = document.createElement("p"); empty.className = "checkout-empty"; empty.textContent = "Your bag is empty."; container.append(empty); }
  document.querySelector("#checkout-total").textContent = displayMoney(total);
}
function renderAddressOptions(addresses) {
  checkoutAddresses = addresses;
  const list = document.querySelector("#checkout-address-list"); list.replaceChildren();
  if (!addresses.length) {
    const empty = document.createElement("p"); empty.className = "checkout-empty"; empty.textContent = "Add a delivery address in your account before placing this order."; list.append(empty); return;
  }
  addresses.forEach((address, index) => {
    const label = document.createElement("label"); label.className = "checkout-address";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "deliveryAddress"; radio.value = address._id; radio.checked = address.isDefault || (!addresses.some((item) => item.isDefault) && index === 0);
    const details = document.createElement("span");
    const name = document.createElement("strong"); name.textContent = `${address.label || "Address"} · ${address.fullName}`;
    details.append(name, document.createTextNode(`${address.street}, ${address.city}${address.region ? `, ${address.region}` : ""}, ${address.country} · ${address.phone}`));
    label.append(radio, details); list.append(label);
  });
}
async function initializeCheckout() {
  try {
    checkoutCart = JSON.parse(localStorage.getItem("home_shape_checkout_cart") || "[]");
    const [products, config] = await Promise.all([checkoutRequest("products"), checkoutRequest("settings")]);
    renderCheckoutItems(products);
    const codEnabled = config.payments?.cashOnDelivery !== false;
    document.querySelector("#place-order").disabled = !codEnabled || !checkoutCart.length;
    if (!codEnabled) checkoutMessage("Cash on delivery is disabled by the store.");
    if (!checkoutSession?.token) {
      checkoutMessage("Sign in to choose your saved address and place an order.");
      localStorage.setItem("home_shape_checkout_cart", JSON.stringify(checkoutCart));
      document.querySelector("#place-order").textContent = "SIGN IN TO CONTINUE";
      document.querySelector("#place-order").disabled = false;
      document.querySelector("#place-order").addEventListener("click", () => { window.location.href = "/account?login=1&returnTo=%2Fcheckout"; }, { once: true });
      return;
    }
    const profile = await checkoutRequest("customer/profile");
    renderAddressOptions(profile.addresses || []);
  } catch (error) { checkoutMessage(error.message); }
}
document.querySelector("#place-order").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!checkoutSession?.token || !checkoutCart.length) return;
  const addressId = document.querySelector('input[name="deliveryAddress"]:checked')?.value;
  if (!addressId) return checkoutMessage("Select a delivery address first.");
  button.disabled = true; checkoutMessage("");
  try {
    const result = await checkoutRequest("customer/orders", { method: "POST", body: JSON.stringify({ items: checkoutCart, addressId }) });
    localStorage.removeItem("home_shape_checkout_cart");
    checkoutMessage(`${result.message} Order ${result.order.number}.`, true);
    button.textContent = "ORDER PLACED";
    setTimeout(() => { window.location.href = "/account?view=dashboard&tab=orders"; }, 1400);
  } catch (error) { checkoutMessage(error.message); button.disabled = false; }
});
initializeCheckout();
