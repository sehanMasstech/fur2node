const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 10000;

function cleanText(value, field, max = 500) {
  if (typeof value !== "string") {
    throw new Error(`${field} must be text.`);
  }
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max) {
    throw new Error(`${field} must be between 1 and ${max} characters.`);
  }
  return cleaned;
}

function validateProduct(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("A product is required.");
  }
  const price = Number(input.price);
  const oldPrice = input.oldPrice === "" || input.oldPrice == null ? null : Number(input.oldPrice);
  if (!Number.isFinite(price) || price < 0 || price > 10000000) {
    throw new Error("Price must be a positive number.");
  }
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < price || oldPrice > 10000000)) {
    throw new Error("Compare-at price must be greater than or equal to the current price.");
  }
  const colors = Array.isArray(input.colors) ? input.colors.map((color) => cleanText(color, "Color", 40)).slice(0, 12) : [];
  const submittedVariants = Array.isArray(input.colorVariants) ? input.colorVariants : [];
  const colorVariants = colors.map((color) => {
    const match = submittedVariants.find((variant) => typeof variant?.color === "string" && variant.color.trim().toLowerCase() === color.toLowerCase());
    return { color, image: typeof match?.image === "string" ? match.image.trim().slice(0, 500) : "" };
  });
  const collections = Array.isArray(input.collections) ? input.collections.map((item) => cleanText(item, "Collection", 40)).slice(0, 12) : ["Featured"];
  return {
    name: cleanText(input.name, "Name", 120),
    category: cleanText(input.category, "Category", 240),
    categoryId: typeof input.categoryId === "string" ? input.categoryId.trim().slice(0, 100) : "",
    brand: typeof input.brand === "string" ? input.brand.trim().slice(0, 80) : "",
    price,
    oldPrice,
    image: cleanText(input.image, "Image path", 500),
    hoverImage: typeof input.hoverImage === "string" ? input.hoverImage.trim().slice(0, 500) : "",
    description: typeof input.description === "string" ? input.description.trim().slice(0, MAX_TEXT_LENGTH) : "",
    detailHeading: typeof input.detailHeading === "string" ? input.detailHeading.trim().slice(0, 160) : "",
    features: Array.isArray(input.features) ? input.features.map((feature) => cleanText(feature, "Feature", 240)).filter(Boolean).slice(0, 12) : [],
    detailDescription: typeof input.detailDescription === "string" ? input.detailDescription.trim().slice(0, MAX_TEXT_LENGTH) : "",
    detailImages: Array.isArray(input.detailImages) ? input.detailImages.map((image) => typeof image === "string" ? image.trim().slice(0, 1000) : "").slice(0, 2) : [],
    colors,
    colorVariants,
    collections,
    badge: typeof input.badge === "string" ? input.badge.trim().slice(0, 30) : "",
    active: input.active !== false
  };
}

function validateInquiry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("An enquiry is required.");
  }
  const email = cleanText(input.email, "Email", 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  const type = input.type === "newsletter" ? "newsletter" : "contact";
  return {
    name: typeof input.name === "string" ? input.name.trim().slice(0, 120) : "",
    email,
    phone: typeof input.phone === "string" ? input.phone.trim().slice(0, 40) : "",
    subject: typeof input.subject === "string" ? input.subject.trim().slice(0, 160) : "",
    message: typeof input.message === "string" ? input.message.trim().slice(0, MAX_TEXT_LENGTH) : "",
    type
  };
}

module.exports = { cleanText, validateInquiry, validateProduct };
