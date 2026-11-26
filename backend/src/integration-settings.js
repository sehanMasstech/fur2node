const crypto = require("node:crypto");

const paymentProviders = ["stripe", "paypal", "sslcommerz", "razorpay", "googlePay", "uddoktaPay", "shurjoPay"];
const courierProviders = ["pathao", "steadfast", "redx", "amazonShipping"];

function defaultIntegrationSettings() {
  return {
    branding: { logoMode: "text", logoImage: "", faviconImage: "", brandText: "Home Shape" },
    seo: { title: "Home Shape | Thoughtful Furniture", description: "Thoughtful furniture and considered home pieces for everyday living.", keywords: "furniture, home, dining, outdoor furniture", canonicalUrl: "", robots: "index,follow", ogImage: "", googleSiteVerification: "", googleAnalyticsId: "", metaPixelId: "" },
    smtp: { enabled: false, host: "", port: 587, secure: false, user: "", passwordEncrypted: "", fromName: "Home Shape", fromEmail: "", activationEnabled: false },
    payments: { cashOnDelivery: true, onlineEnabled: false, providers: Object.fromEntries(paymentProviders.map((key) => [key, { enabled: false, credentialsEncrypted: "" }])) },
    shipping: { manual: true, providers: Object.fromEntries(courierProviders.map((key) => [key, { enabled: false, credentialsEncrypted: "" }])) }
  };
}

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured before saving integration credentials.");
  return crypto.createHash("sha256").update(`home-shape-integrations:${secret}`).digest();
}

function encryptSecret(value) {
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptSecret(value) {
  if (!value) return "";
  const [encodedIv, encodedTag, encodedData] = String(value).split(".");
  if (!encodedIv || !encodedTag || !encodedData) throw new Error("Saved mail credentials could not be decrypted.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encodedData, "base64url")), decipher.final()]).toString("utf8");
}

function secretIsSet(value) { return typeof value === "string" && value.length > 0; }

function publicIntegrationSettings(value = {}) {
  const defaults = defaultIntegrationSettings();
  const merged = {
    ...defaults, ...value,
    branding: { ...defaults.branding, ...(value.branding || {}) },
    seo: { ...defaults.seo, ...(value.seo || {}) },
    smtp: { ...defaults.smtp, ...(value.smtp || {}) },
    payments: { ...defaults.payments, ...(value.payments || {}), providers: { ...defaults.payments.providers, ...(value.payments?.providers || {}) } },
    shipping: { ...defaults.shipping, ...(value.shipping || {}), providers: { ...defaults.shipping.providers, ...(value.shipping?.providers || {}) } }
  };
  merged.smtp.passwordConfigured = secretIsSet(merged.smtp.passwordEncrypted);
  delete merged.smtp.passwordEncrypted;
  for (const provider of paymentProviders) {
    merged.payments.providers[provider] = { ...defaults.payments.providers[provider], ...(merged.payments.providers[provider] || {}) };
    merged.payments.providers[provider].credentialsConfigured = secretIsSet(merged.payments.providers[provider].credentialsEncrypted);
    delete merged.payments.providers[provider].credentialsEncrypted;
  }
  for (const provider of courierProviders) {
    merged.shipping.providers[provider] = { ...defaults.shipping.providers[provider], ...(merged.shipping.providers[provider] || {}) };
    merged.shipping.providers[provider].credentialsConfigured = secretIsSet(merged.shipping.providers[provider].credentialsEncrypted);
    delete merged.shipping.providers[provider].credentialsEncrypted;
  }
  return merged;
}

function sanitizeIntegrationSettings(input, previous = {}) {
  const defaults = defaultIntegrationSettings();
  const previousSmtpPassword = typeof previous.smtp?.passwordEncrypted === "string" ? previous.smtp.passwordEncrypted : "";
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const text = (source, key, max = 300) => typeof source?.[key] === "string" ? source[key].trim().slice(0, max) : "";
  const bool = (source, key, fallback = false) => typeof source?.[key] === "boolean" ? source[key] : fallback;
  const result = {
    branding: {
      logoMode: ["icon", "text", "icon-text"].includes(text(value.branding, "logoMode", 20)) ? text(value.branding, "logoMode", 20) : defaults.branding.logoMode,
      logoImage: text(value.branding, "logoImage", 1000), faviconImage: text(value.branding, "faviconImage", 1000),
      brandText: text(value.branding, "brandText", 80) || defaults.branding.brandText
    },
    seo: {
      title: text(value.seo, "title", 120) || defaults.seo.title,
      description: text(value.seo, "description", 320), keywords: text(value.seo, "keywords", 500),
      canonicalUrl: text(value.seo, "canonicalUrl", 500), googleSiteVerification: text(value.seo, "googleSiteVerification", 200),
      robots: ["index,follow", "noindex,follow"].includes(text(value.seo, "robots", 40)) ? text(value.seo, "robots", 40) : defaults.seo.robots,
      ogImage: text(value.seo, "ogImage", 500),
      googleAnalyticsId: text(value.seo, "googleAnalyticsId", 40), metaPixelId: text(value.seo, "metaPixelId", 40)
    },
    smtp: {
      enabled: bool(value.smtp, "enabled"), host: text(value.smtp, "host", 253), port: Math.max(1, Math.min(65535, Number(value.smtp?.port) || 587)),
      secure: bool(value.smtp, "secure"), user: text(value.smtp, "user", 254), fromName: text(value.smtp, "fromName", 100) || "Home Shape",
      fromEmail: text(value.smtp, "fromEmail", 254), activationEnabled: bool(value.smtp, "activationEnabled"),
      passwordEncrypted: text(value.smtp, "passwordEncrypted", 2000) || previousSmtpPassword
    },
    payments: { cashOnDelivery: bool(value.payments, "cashOnDelivery", true), onlineEnabled: bool(value.payments, "onlineEnabled"), providers: {} },
    shipping: { manual: bool(value.shipping, "manual", true), providers: {} }
  };
  for (const provider of paymentProviders) {
    const candidate = value.payments?.providers?.[provider] || {};
    result.payments.providers[provider] = {
      enabled: bool(candidate, "enabled"), credentialsEncrypted: text(candidate, "credentialsEncrypted", 4000) || previous.payments?.providers?.[provider]?.credentialsEncrypted || ""
    };
  }
  for (const provider of courierProviders) {
    const candidate = value.shipping?.providers?.[provider] || {};
    result.shipping.providers[provider] = {
      enabled: bool(candidate, "enabled"), credentialsEncrypted: text(candidate, "credentialsEncrypted", 4000) || previous.shipping?.providers?.[provider]?.credentialsEncrypted || ""
    };
  }
  return result;
}

module.exports = { courierProviders, decryptSecret, defaultIntegrationSettings, encryptSecret, paymentProviders, publicIntegrationSettings, sanitizeIntegrationSettings };
