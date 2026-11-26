require("dotenv").config();

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Admin, Content, Customer, CustomerOrder, Expense, Inquiry, Product, ProductReview } = require("./src/models");
const { flattenCategoryTree, normalizeCategoryTree } = require("./src/category-tree");
const { products: defaultProducts, site: defaultSite } = require("./src/defaults");
const { validateInquiry, validateProduct } = require("./src/validation");
const { courierProviders, decryptSecret, defaultIntegrationSettings, encryptSecret, paymentProviders, publicIntegrationSettings, sanitizeIntegrationSettings } = require("./src/integration-settings");
const { sendSmtpMail, validateMailSettings } = require("./src/smtp-mail");

const app = express();
const port = Number(process.env.PORT) || 3001;
const tokenCookie = "home_shape_admin";

function siteWithCategories(value) {
  const tree = normalizeCategoryTree(value.categoryTree, value.categories || defaultSite.categories);
  return {
    ...defaultSite,
    ...value,
    pages: { ...defaultSite.pages, ...(value.pages || {}) },
    postSections: Array.isArray(value.postSections) ? value.postSections : defaultSite.postSections,
    blogAuthor: value.blogAuthor || defaultSite.blogAuthor,
    categories: tree.map((category) => category.name),
    categoryTree: tree
  };
}

function mapProductsToCategoryPaths(products, site) {
  const entries = flattenCategoryTree(site.categoryTree);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  return products.map((product) => {
    const category = (product.categoryId && byId.get(product.categoryId)) || byPath.get(product.category);
    return category
      ? { ...product, category: category.path, categoryId: category.id }
      : product;
  });
}

async function syncProductCategoryPaths(previousSite, nextSite) {
  const previousEntries = flattenCategoryTree(previousSite.categoryTree);
  const nextEntries = flattenCategoryTree(nextSite.categoryTree);
  const previousById = new Map(previousEntries.map((entry) => [entry.id, entry]));
  const previousByPath = new Map(previousEntries.map((entry) => [entry.path, entry]));
  const nextById = new Map(nextEntries.map((entry) => [entry.id, entry]));
  const products = await Product.find({}).select("category categoryId").lean();
  const operations = [];

  products.forEach((product) => {
    const previous = (product.categoryId && previousById.get(product.categoryId)) || previousByPath.get(product.category);
    if (!previous) return;
    const next = nextById.get(previous.id);
    const update = next
      ? { category: next.path, categoryId: next.id }
      : { category: product.category, categoryId: "" };
    if (update.category !== product.category || update.categoryId !== (product.categoryId || "")) {
      operations.push({ updateOne: { filter: { _id: product._id }, update: { $set: update } } });
    }
  });

  if (operations.length) await Product.bulkWrite(operations);
}

function resolveProductCategory(data, site) {
  if (!data.categoryId) return data;
  const category = flattenCategoryTree(site.categoryTree).find((entry) => entry.id === data.categoryId);
  if (!category) throw Object.assign(new Error("Choose a category that still exists."), { status: 400 });
  return { ...data, category: category.path };
}

function requireEnvironment() {
  const required = ["MONGODB_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "FRONTEND_ORIGIN"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}. Copy backend/.env.example to backend/.env and set them.`);
  }
  if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  if (process.env.ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
}

async function initializeDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({ email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash });
    console.log(`Created initial admin account for ${process.env.ADMIN_EMAIL}.`);
  }
  if (!(await Content.exists({ key: "site" }))) await Content.create({ key: "site", value: defaultSite });
  const siteRecord = await Content.findOne({ key: "site" });
  const currentSite = siteWithCategories(siteRecord.value);
  if (JSON.stringify(siteRecord.value.categoryTree || []) !== JSON.stringify(currentSite.categoryTree) ||
      JSON.stringify(siteRecord.value.categories || []) !== JSON.stringify(currentSite.categories)) {
    siteRecord.value = currentSite;
    await siteRecord.save();
  }
  if (!(await Product.exists({}))) await Product.insertMany(defaultProducts);
  await syncProductCategoryPaths(currentSite, currentSite);
}

function authenticateAdmin(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : req.cookies[tokenCookie];
  if (!token) return res.status(401).json({ error: "Please sign in to continue." });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    res.clearCookie(tokenCookie);
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function authenticateCustomer(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token) return res.status(401).json({ error: "Please sign in to view your account." });
  try {
    const session = jwt.verify(token, process.env.JWT_SECRET);
    if (session.role !== "customer") throw new Error("Invalid customer session.");
    req.customerId = session.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This frontend origin is not allowed by the API."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." }
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many accounts were created from this connection. Please try again later." }
});
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many messages were submitted. Please try again later." }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/site", asyncRoute(async (req, res) => {
  const record = await Content.findOne({ key: "site" }).lean();
  res.json(siteWithCategories(record ? record.value : defaultSite));
}));
app.get("/api/settings", asyncRoute(async (req, res) => {
  const record = await Content.findOne({ key: "integrations" }).lean();
  const settings = publicIntegrationSettings(record?.value || defaultIntegrationSettings());
  res.set("Cache-Control", "no-store").json({
    branding: settings.branding,
    seo: settings.seo,
    payments: { cashOnDelivery: settings.payments.cashOnDelivery, onlineEnabled: settings.payments.onlineEnabled, providers: Object.fromEntries(paymentProviders.map((key) => [key, settings.payments.providers[key].enabled])) }
  });
}));
app.get("/api/products", asyncRoute(async (req, res) => {
  const [products, record, reviewSummaries] = await Promise.all([
    Product.find({ active: true }).sort({ id: 1 }).lean(),
    Content.findOne({ key: "site" }).lean(),
    ProductReview.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$productId", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
    ])
  ]);
  const site = siteWithCategories(record ? record.value : defaultSite);
  const reviewByProduct = new Map(reviewSummaries.map((summary) => [summary._id, summary]));
  res.set("Cache-Control", "no-store, max-age=0").json(mapProductsToCategoryPaths(products, site).map((product) => {
    const summary = reviewByProduct.get(product.id);
    return { ...product, old: product.oldPrice, alt: product.name, averageRating: summary ? Number(summary.averageRating.toFixed(2)) : null, reviewCount: summary?.reviewCount || 0 };
  }));
}));
app.get("/api/products/:id/reviews", asyncRoute(async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isSafeInteger(productId) || productId < 1) return res.status(400).json({ error: "Invalid product id." });
  const [reviews, counts] = await Promise.all([
    ProductReview.find({ productId, status: "approved" }).populate("customer", "username fullName").sort({ createdAt: -1 }).lean(),
    ProductReview.aggregate([{ $match: { productId, status: "approved" } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" }, ratings: { $push: "$rating" } } }])
  ]);
  const summary = counts[0] || { count: 0, average: 0, ratings: [] };
  res.set("Cache-Control", "no-store").json({
    count: summary.count, average: Number((summary.average || 0).toFixed(2)),
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: summary.ratings.filter((value) => value === rating).length })),
    reviews: reviews.map((review) => ({ id: String(review._id), rating: review.rating, comment: review.comment, verifiedPurchase: review.verifiedPurchase, createdAt: review.createdAt, customerName: review.customer?.fullName || review.customer?.username || "Verified customer", reply: review.reply?.comment ? { displayName: review.reply.displayName, comment: review.reply.comment, repliedAt: review.reply.repliedAt } : null }))
  });
}));
app.post("/api/inquiries", inquiryLimiter, asyncRoute(async (req, res) => {
  const inquiry = validateInquiry(req.body);
  if (inquiry.type === "contact" && inquiry.message.length < 5) {
    return res.status(400).json({ error: "Please include a message of at least five characters." });
  }
  const created = await Inquiry.create(inquiry);
  res.status(201).json({ id: created._id, message: "Thanks — your message has been received." });
}));

app.post("/api/auth/register", registrationLimiter, asyncRoute(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
    return res.status(400).json({ error: "Choose a username with 3–40 letters, numbers, dots, dashes or underscores." });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Your password must be between 8 and 128 characters." });
  }
  if (await Customer.exists({ $or: [{ username }, { email }] })) {
    return res.status(409).json({ error: "That username or email is already registered." });
  }
  const integrationRecord = await Content.findOne({ key: "integrations" }).lean();
  const integrationSettings = publicIntegrationSettings(integrationRecord?.value || defaultIntegrationSettings());
  const activationEnabled = integrationSettings.smtp.activationEnabled;
  if (activationEnabled && (!integrationSettings.smtp.enabled || !integrationSettings.smtp.passwordConfigured)) {
    return res.status(503).json({ error: "Account activation is enabled but SMTP is not fully configured. Contact the store administrator." });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    if (activationEnabled) {
      const rawToken = crypto.randomBytes(32).toString("base64url");
      const customer = await Customer.create({ username, email, passwordHash, active: false, activationTokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"), activationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      const token = encryptSecretForLink(rawToken);
      const activationUrl = `${process.env.FRONTEND_ORIGIN.replace(/\/+$/, "")}/account?activation=${encodeURIComponent(token)}`;
      try {
        await sendSmtpMail(integrationSettings, decryptSecret(integrationRecord.value.smtp.passwordEncrypted), {
          to: email, subject: "Activate your Home Shape account",
          text: `Hello ${username},\n\nActivate your account within 24 hours: ${activationUrl}`,
          html: `<p>Hello ${escapeEmailHtml(username)},</p><p>Please confirm your email to activate your Home Shape account.</p><p><a href="${activationUrl}">Activate my account</a></p><p>This link expires in 24 hours.</p>`
        });
      } catch (error) {
        await Customer.deleteOne({ _id: customer._id });
        console.error("Account activation email could not be sent:", error.message);
        return res.status(503).json({ error: "We could not send the activation email. Please try again later." });
      }
      return res.status(201).json({ message: "Check your email for a link to activate your account.", username: customer.username });
    }
    const customer = await Customer.create({ username, email, passwordHash });
    res.status(201).json({ message: "Your account is ready. Please sign in.", username: customer.username });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "That username or email is already registered." });
    throw error;
  }
}));

function escapeEmailHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function encryptSecretForLink(value) { return Buffer.from(value).toString("base64url"); }
app.post("/api/auth/activate", registrationLimiter, asyncRoute(async (req, res) => {
  const encoded = typeof req.body?.token === "string" ? req.body.token : "";
  let token = "";
  try { token = Buffer.from(encoded, "base64url").toString("utf8"); } catch {}
  if (token.length < 32 || token.length > 256) return res.status(400).json({ error: "This activation link is invalid." });
  const activationTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const customer = await Customer.findOneAndUpdate({ activationTokenHash, active: false, activationExpiresAt: { $gt: new Date() } }, { $set: { active: true, activationTokenHash: "", activationExpiresAt: null } }, { new: true });
  if (!customer) return res.status(400).json({ error: "This activation link is invalid or has expired. Please register again." });
  res.json({ message: "Your email is confirmed. You can now sign in." });
}));

app.post("/api/auth/login", loginLimiter, asyncRoute(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const customer = await Customer.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }]
  });
  if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
    return res.status(401).json({ error: "Username or password is incorrect." });
  }
  if (customer.active === false) return res.status(403).json({ error: "Confirm your email using the activation link before signing in." });
  const token = jwt.sign({ sub: customer.id, email: customer.email, username: customer.username, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, username: customer.username, email: customer.email });
}));

app.get("/api/customer/profile", authenticateCustomer, asyncRoute(async (req, res) => {
  const customer = await Customer.findById(req.customerId).select("username email fullName imageData addresses createdAt").lean();
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  res.json(customer);
}));
app.put("/api/customer/profile", authenticateCustomer, asyncRoute(async (req, res) => {
  const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";
  if (fullName.length > 100) return res.status(400).json({ error: "Your name must be 100 characters or fewer." });
  const customer = await Customer.findByIdAndUpdate(req.customerId, { $set: { fullName } }, { new: true, runValidators: true })
    .select("username email fullName imageData addresses createdAt").lean();
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  res.json(customer);
}));
app.post("/api/customer/addresses", authenticateCustomer, asyncRoute(async (req, res) => {
  const fields = ["label", "fullName", "phone", "street", "city", "region", "postalCode", "country"];
  const address = Object.fromEntries(fields.map((key) => [key, typeof req.body?.[key] === "string" ? req.body[key].trim() : ""]));
  if (!["fullName", "phone", "street", "city", "country"].every((key) => address[key])) return res.status(400).json({ error: "Name, phone, street, city, and country are required." });
  if (Object.values(address).some((value) => value.length > 240)) return res.status(400).json({ error: "One or more address fields are too long." });
  const customer = await Customer.findById(req.customerId);
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  const makeDefault = req.body?.isDefault === true || customer.addresses.length === 0;
  if (makeDefault) customer.addresses.forEach((entry) => { entry.isDefault = false; });
  customer.addresses.push({ ...address, label: address.label || "Home", isDefault: makeDefault });
  await customer.save();
  res.status(201).json({ addresses: customer.addresses });
}));
app.delete("/api/customer/addresses/:addressId", authenticateCustomer, asyncRoute(async (req, res) => {
  const customer = await Customer.findById(req.customerId);
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  const address = customer.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ error: "Address not found." });
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && customer.addresses.length) customer.addresses[0].isDefault = true;
  await customer.save();
  res.json({ addresses: customer.addresses });
}));
app.put("/api/customer/avatar", authenticateCustomer, asyncRoute(async (req, res) => {
  const imageData = typeof req.body?.imageData === "string" ? req.body.imageData : "";
  if (imageData && (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageData) || imageData.length > 1450000)) {
    return res.status(400).json({ error: "Upload a JPG, PNG or WebP image smaller than 1 MB." });
  }
  const customer = await Customer.findByIdAndUpdate(req.customerId, { $set: { imageData } }, { new: true })
    .select("username email fullName imageData createdAt").lean();
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  res.json(customer);
}));
app.put("/api/customer/password", authenticateCustomer, asyncRoute(async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  const customer = await Customer.findById(req.customerId);
  if (!customer || !(await bcrypt.compare(currentPassword, customer.passwordHash))) {
    return res.status(400).json({ error: "Your current password is incorrect." });
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: "Your new password must be between 8 and 128 characters." });
  }
  customer.passwordHash = await bcrypt.hash(newPassword, 12);
  await customer.save();
  res.json({ message: "Your password has been updated." });
}));
app.get("/api/customer/orders", authenticateCustomer, asyncRoute(async (req, res) => {
  const orders = await CustomerOrder.find({ customer: req.customerId }).sort({ createdAt: -1 }).lean();
  res.json(orders);
}));
app.post("/api/customer/orders", authenticateCustomer, asyncRoute(async (req, res) => {
  const settingsRecord = await Content.findOne({ key: "integrations" }).lean();
  const config = settingsRecord?.value || defaultIntegrationSettings();
  if (!config.payments?.cashOnDelivery) return res.status(400).json({ error: "Cash on delivery is currently unavailable." });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length || items.length > 50) return res.status(400).json({ error: "Your cart is empty or too large." });
  const quantities = new Map();
  for (const item of items) {
    const id = Number(item?.id), quantity = Number(item?.quantity);
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error: "Your cart contains an invalid item." });
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }
  const products = await Product.find({ id: { $in: [...quantities.keys()] }, active: { $ne: false } }).lean();
  if (products.length !== quantities.size) return res.status(400).json({ error: "One or more products are no longer available." });
  const customer = await Customer.findById(req.customerId);
  if (!customer) return res.status(404).json({ error: "Customer account not found." });
  const address = customer.addresses.id(String(req.body?.addressId || ""));
  if (!address) return res.status(400).json({ error: "Select or add a delivery address." });
  const orderItems = products.map((product) => ({ productId: product.id, name: product.name, image: product.image, quantity: quantities.get(product.id), price: Number(product.price) }));
  const total = Number(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const number = `HS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const order = await CustomerOrder.create({ customer: customer._id, number, total, items: orderItems, paymentMethod: "cashOnDelivery", paymentStatus: "pending", shippingAddress: address.toObject() });
  res.status(201).json({ order: { number: order.number, total: order.total }, message: "Order placed. Payment is due on delivery." });
}));
app.post("/api/customer/reviews", authenticateCustomer, asyncRoute(async (req, res) => {
  const productId = Number(req.body?.productId);
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
  if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 10 || comment.length > 4000) return res.status(400).json({ error: "Choose a 1–5 star rating and write a comment between 10 and 4,000 characters." });
  const product = await Product.findOne({ id: productId, active: true }).select("id name").lean();
  if (!product) return res.status(404).json({ error: "This product is no longer available." });
  const deliveredOrder = await CustomerOrder.exists({ customer: req.customerId, status: "delivered", $or: [{ "items.productId": productId }, { "items.name": product.name }] });
  if (!deliveredOrder) return res.status(403).json({ error: "Only customers with a delivered order for this product can submit a review." });
  if (await ProductReview.exists({ customer: req.customerId, productId })) return res.status(409).json({ error: "You have already reviewed this product." });
  const review = await ProductReview.create({ productId, customer: req.customerId, rating, comment, status: "pending", verifiedPurchase: true });
  res.status(201).json({ id: String(review._id), message: "Thanks. Your verified review is awaiting admin approval." });
}));

app.post("/api/admin/login", loginLimiter, asyncRoute(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.cookie(tokenCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/"
  });
  res.json({ email: admin.email, token });
}));
app.post("/api/admin/logout", (req, res) => {
  res.clearCookie(tokenCookie, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
  res.status(204).end();
});
app.get("/api/admin/me", authenticateAdmin, (req, res) => res.json({ email: req.admin.email }));
app.get("/api/admin/summary", authenticateAdmin, asyncRoute(async (req, res) => {
  const [products, inquiries, newInquiries] = await Promise.all([
    Product.countDocuments({}),
    Inquiry.countDocuments({}),
    Inquiry.countDocuments({ status: "new" })
  ]);
  res.json({ products, inquiries, newInquiries });
}));
app.get("/api/admin/orders", authenticateAdmin, asyncRoute(async (req, res) => {
  const orders = await CustomerOrder.find({}).populate("customer", "username email fullName").sort({ createdAt: -1 }).limit(250).lean();
  res.json(orders);
}));
app.get("/api/admin/reviews", authenticateAdmin, asyncRoute(async (req, res) => {
  const reviews = await ProductReview.find({}).populate("customer", "username email fullName").sort({ createdAt: -1 }).limit(500).lean();
  const products = await Product.find({ id: { $in: [...new Set(reviews.map((review) => review.productId))] } }).select("id name").lean();
  const names = new Map(products.map((product) => [product.id, product.name]));
  res.json(reviews.map((review) => ({ ...review, productName: names.get(review.productId) || "Deleted product", customerName: review.customer?.fullName || review.customer?.username || "Customer", customerEmail: review.customer?.email || "" })));
}));
app.patch("/api/admin/reviews/:id", authenticateAdmin, asyncRoute(async (req, res) => {
  const status = req.body?.status;
  const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
  const comment = typeof req.body?.reply === "string" ? req.body.reply.trim() : "";
  if (!status || !["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ error: "Choose pending, approved, or rejected." });
  if (comment && (!displayName || displayName.length > 80 || comment.length > 3000)) return res.status(400).json({ error: "Replies need a display name of 1–80 characters and a reply under 3,000 characters." });
  const update = { status };
  if (comment) update.reply = { displayName, comment, repliedAt: new Date() };
  const review = await ProductReview.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
  if (!review) return res.status(404).json({ error: "Review not found." });
  res.json({ id: String(review._id), status: review.status, reply: review.reply });
}));
app.patch("/api/admin/orders/:orderId", authenticateAdmin, asyncRoute(async (req, res) => {
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) return res.status(400).json({ error: "Choose a valid order status." });
  const updates = { status };
  if (status === "delivered") updates.paymentStatus = "paid";
  const order = await CustomerOrder.findByIdAndUpdate(req.params.orderId, { $set: updates }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
}));
app.get("/api/admin/reports", authenticateAdmin, asyncRoute(async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to < from || to - from > 366 * 24 * 60 * 60 * 1000) return res.status(400).json({ error: "Choose a valid date range of one year or less." });
  to.setHours(23, 59, 59, 999);
  const [orders, expenses] = await Promise.all([
    CustomerOrder.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: -1 }).lean(),
    Expense.find({ date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean()
  ]);
  const incomeOrders = orders.filter((order) => order.paymentStatus === "paid" || order.status === "delivered");
  const income = incomeOrders.reduce((sum, order) => sum + order.total, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingSales = orders.filter((order) => order.status !== "cancelled" && !incomeOrders.includes(order)).reduce((sum, order) => sum + order.total, 0);
  const ledger = [
    ...orders.map((order) => ({ id: String(order._id), type: incomeOrders.includes(order) ? "income" : "order", description: `Order ${order.number} · ${order.status}`, category: "Sales", amount: order.total, date: order.createdAt, orderNumber: order.number, address: order.shippingAddress, items: order.items, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus })),
    ...expenses.map((expense) => ({ id: String(expense._id), type: "expense", description: expense.description, category: expense.category, amount: expense.amount, date: expense.date, note: expense.note }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ from, to, currency: "AED", income, expenses: expenseTotal, pendingSales, profit: income - expenseTotal, orderCount: orders.length, ledger });
}));
app.post("/api/admin/expenses", authenticateAdmin, asyncRoute(async (req, res) => {
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";
  const amount = Number(req.body?.amount);
  const date = new Date(req.body?.date);
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  if (!description || !category || description.length > 180 || category.length > 80 || !Number.isFinite(amount) || amount <= 0 || amount > 100000000 || !Number.isFinite(date.getTime())) return res.status(400).json({ error: "Enter a description, category, positive amount, and valid date." });
  const expense = await Expense.create({ description, category, amount: Number(amount.toFixed(2)), date, note });
  res.status(201).json(expense);
}));
app.delete("/api/admin/expenses/:expenseId", authenticateAdmin, asyncRoute(async (req, res) => {
  const result = await Expense.deleteOne({ _id: req.params.expenseId });
  if (!result.deletedCount) return res.status(404).json({ error: "Expense entry not found." });
  res.status(204).end();
}));
app.post("/api/admin/cloudinary-signature", authenticateAdmin, (req, res) => {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ error: "Cloudinary uploads are not configured on the backend." });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "home-shape";
  const signature = crypto.createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  res.set("Cache-Control", "no-store");
  res.json({ cloudName, apiKey, timestamp, folder, signature });
});
app.get("/api/admin/site", authenticateAdmin, asyncRoute(async (req, res) => {
  const record = await Content.findOne({ key: "site" }).lean();
  res.json(siteWithCategories(record ? record.value : defaultSite));
}));
app.get("/api/admin/settings", authenticateAdmin, asyncRoute(async (req, res) => {
  const record = await Content.findOne({ key: "integrations" }).lean();
  res.set("Cache-Control", "no-store").json(publicIntegrationSettings(record?.value || defaultIntegrationSettings()));
}));
app.put("/api/admin/settings", authenticateAdmin, asyncRoute(async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || JSON.stringify(req.body).length > 30000) {
    return res.status(400).json({ error: "Settings must be a JSON object smaller than 30 KB." });
  }
  const record = await Content.findOne({ key: "integrations" }).lean();
  const previous = record?.value || defaultIntegrationSettings();
  const submitted = structuredClone(req.body);
  submitted.smtp ||= {};
  if (typeof submitted.smtp.password === "string" && submitted.smtp.password.trim()) submitted.smtp.passwordEncrypted = encryptSecret(submitted.smtp.password.trim());
  delete submitted.smtp.password;
  for (const provider of paymentProviders) {
    const entry = submitted.payments?.providers?.[provider];
    if (typeof entry?.credentials === "string" && entry.credentials.trim()) entry.credentialsEncrypted = encryptSecret(entry.credentials.trim());
    if (entry) delete entry.credentials;
  }
  for (const provider of courierProviders) {
    const entry = submitted.shipping?.providers?.[provider];
    if (typeof entry?.credentials === "string" && entry.credentials.trim()) entry.credentialsEncrypted = encryptSecret(entry.credentials.trim());
    if (entry) delete entry.credentials;
  }
  const settings = sanitizeIntegrationSettings(submitted, previous);
  if (settings.smtp.activationEnabled && (!settings.smtp.enabled || !settings.smtp.host || !settings.smtp.user || !settings.smtp.fromEmail || !settings.smtp.passwordEncrypted)) {
    return res.status(400).json({ error: "Configure and enable SMTP before requiring account activation." });
  }
  await Content.findOneAndUpdate({ key: "integrations" }, { $set: { value: settings } }, { upsert: true, new: true, runValidators: true });
  res.set("Cache-Control", "no-store").json(publicIntegrationSettings(settings));
}));
app.post("/api/admin/settings/test-email", authenticateAdmin, asyncRoute(async (req, res) => {
  const record = await Content.findOne({ key: "integrations" }).lean();
  const settings = publicIntegrationSettings(record?.value || defaultIntegrationSettings());
  if (!settings.smtp.passwordConfigured) return res.status(400).json({ error: "Save an SMTP password before sending a test email." });
  const password = decryptSecret(record.value.smtp.passwordEncrypted);
  await sendSmtpMail(settings, password, {
    to: settings.smtp.fromEmail, subject: "Home Shape SMTP test",
    text: "Your Home Shape SMTP settings can send email.", html: "<p>Your Home Shape SMTP settings can send email.</p>"
  });
  res.json({ message: `Test email sent to ${settings.smtp.fromEmail}.` });
}));
app.put("/api/admin/site", authenticateAdmin, asyncRoute(async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || JSON.stringify(req.body).length > 100000) {
    return res.status(400).json({ error: "Site content must be a JSON object smaller than 100 KB." });
  }
  const currentRecord = await Content.findOne({ key: "site" }).lean();
  const previousSite = siteWithCategories(currentRecord ? currentRecord.value : defaultSite);
  const nextSite = siteWithCategories(req.body);
  const updated = await Content.findOneAndUpdate(
    { key: "site" },
    { $set: { value: nextSite } },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  await syncProductCategoryPaths(previousSite, nextSite);
  res.json(updated.value);
}));
app.get("/api/admin/products", authenticateAdmin, asyncRoute(async (req, res) => {
  const [products, record] = await Promise.all([
    Product.find({}).sort({ id: 1 }).lean(),
    Content.findOne({ key: "site" }).lean()
  ]);
  res.json(mapProductsToCategoryPaths(products, siteWithCategories(record ? record.value : defaultSite)));
}));
app.post("/api/admin/products", authenticateAdmin, asyncRoute(async (req, res) => {
  const siteRecord = await Content.findOne({ key: "site" }).lean();
  const data = resolveProductCategory(validateProduct(req.body), siteWithCategories(siteRecord ? siteRecord.value : defaultSite));
  const product = await Product.create({ ...data, id: Date.now() });
  res.status(201).json(product);
}));
app.put("/api/admin/products/:id", authenticateAdmin, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid product id." });
  const siteRecord = await Content.findOne({ key: "site" }).lean();
  const data = resolveProductCategory(validateProduct(req.body), siteWithCategories(siteRecord ? siteRecord.value : defaultSite));
  const product = await Product.findOneAndUpdate({ id }, { $set: data }, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product);
}));
app.delete("/api/admin/products/:id", authenticateAdmin, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid product id." });
  const result = await Product.deleteOne({ id });
  if (!result.deletedCount) return res.status(404).json({ error: "Product not found." });
  res.status(204).end();
}));
app.get("/api/admin/inquiries", authenticateAdmin, asyncRoute(async (req, res) => {
  res.json(await Inquiry.find({}).sort({ createdAt: -1 }).limit(500).lean());
}));
app.patch("/api/admin/inquiries/:id", authenticateAdmin, asyncRoute(async (req, res) => {
  if (!["new", "read", "replied"].includes(req.body?.status)) {
    return res.status(400).json({ error: "Choose a valid enquiry status." });
  }
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!inquiry) return res.status(404).json({ error: "Enquiry not found." });
  res.json(inquiry);
}));
app.delete("/api/admin/inquiries/:id", authenticateAdmin, asyncRoute(async (req, res) => {
  const result = await Inquiry.deleteOne({ _id: req.params.id });
  if (!result.deletedCount) return res.status(404).json({ error: "Enquiry not found." });
  res.status(204).end();
}));

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
  if (error.status === 400) return res.status(400).json({ error: error.message });
  res.status(500).json({ error: "The server could not complete the request." });
});

async function start() {
  requireEnvironment();
  await initializeDatabase();
  app.listen(port, () => console.log(`Home Shape API running at http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
