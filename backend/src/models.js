const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 40 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  fullName: { type: String, trim: true, maxlength: 100, default: "" },
  imageData: { type: String, maxlength: 1500000, default: "" },
  active: { type: Boolean, default: true },
  activationTokenHash: { type: String, default: "" },
  activationExpiresAt: { type: Date, default: null },
  addresses: [{ label: { type: String, maxlength: 40, default: "Home" }, fullName: { type: String, required: true, maxlength: 100 }, phone: { type: String, required: true, maxlength: 40 }, street: { type: String, required: true, maxlength: 240 }, city: { type: String, required: true, maxlength: 100 }, region: { type: String, maxlength: 100, default: "" }, postalCode: { type: String, maxlength: 24, default: "" }, country: { type: String, required: true, maxlength: 80 }, isDefault: { type: Boolean, default: false } }],
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const customerOrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  number: { type: String, required: true, unique: true },
  status: { type: String, enum: ["processing", "shipped", "delivered", "cancelled"], default: "processing" },
  paymentMethod: { type: String, enum: ["cashOnDelivery", "online"], default: "cashOnDelivery" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  shippingAddress: { label: String, fullName: String, phone: String, street: String, city: String, region: String, postalCode: String, country: String },
  total: { type: Number, required: true, min: 0 },
  items: [{ productId: { type: Number, index: true }, name: { type: String, required: true }, image: { type: String, default: "" }, quantity: { type: Number, required: true, min: 1 }, price: { type: Number, required: true, min: 0 } }]
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, maxlength: 120 },
  category: { type: String, required: true, maxlength: 240 },
  categoryId: { type: String, maxlength: 100, default: "" },
  brand: { type: String, maxlength: 80, default: "" },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null, min: 0 },
  image: { type: String, required: true, maxlength: 500 },
  hoverImage: { type: String, maxlength: 500, default: "" },
  description: { type: String, maxlength: 10000, default: "" },
  detailHeading: { type: String, maxlength: 160, default: "" },
  features: { type: [String], default: [] },
  detailDescription: { type: String, maxlength: 10000, default: "" },
  detailImages: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  colorVariants: [{ color: { type: String, required: true, maxlength: 40 }, image: { type: String, maxlength: 500, default: "" } }],
  collections: { type: [String], default: ["Featured"] },
  badge: { type: String, maxlength: 30, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const contentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const inquirySchema = new mongoose.Schema({
  name: { type: String, maxlength: 120, default: "" },
  email: { type: String, required: true, maxlength: 254 },
  phone: { type: String, maxlength: 40, default: "" },
  subject: { type: String, maxlength: 160, default: "" },
  message: { type: String, maxlength: 10000, default: "" },
  type: { type: String, enum: ["contact", "newsletter"], default: "contact" },
  status: { type: String, enum: ["new", "read", "replied"], default: "new" }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, index: true },
  note: { type: String, trim: true, maxlength: 500, default: "" }
}, { timestamps: true });

const productReviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  verifiedPurchase: { type: Boolean, default: true },
  reply: { displayName: { type: String, maxlength: 80, default: "" }, comment: { type: String, maxlength: 3000, default: "" }, repliedAt: { type: Date, default: null } }
}, { timestamps: true });
productReviewSchema.index({ customer: 1, productId: 1 }, { unique: true });

module.exports = {
  Admin: mongoose.model("Admin", adminSchema),
  Customer: mongoose.model("Customer", customerSchema),
  CustomerOrder: mongoose.model("CustomerOrder", customerOrderSchema),
  Content: mongoose.model("Content", contentSchema),
  Inquiry: mongoose.model("Inquiry", inquirySchema),
  Expense: mongoose.model("Expense", expenseSchema),
  ProductReview: mongoose.model("ProductReview", productReviewSchema),
  Product: mongoose.model("Product", productSchema)
};
