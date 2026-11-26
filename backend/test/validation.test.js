const test = require("node:test");
const assert = require("node:assert/strict");
const { validateInquiry, validateProduct } = require("../src/validation");

const product = {
  name: "Dining chair",
  category: "Furniture",
  price: 99,
  oldPrice: 129,
  image: "img/chair.jpg",
  colors: ["Oak"],
  collections: ["Featured"]
};

test("product validation normalizes sale price and default fields", () => {
  const result = validateProduct(product);
  assert.equal(result.price, 99);
  assert.equal(result.oldPrice, 129);
  assert.equal(result.active, true);
  assert.deepEqual(result.colors, ["Oak"]);
});

test("product validation rejects compare-at price below the selling price", () => {
  assert.throws(() => validateProduct({ ...product, oldPrice: 50 }), /greater than or equal/);
});

test("product validation accepts stable category ids and nested category paths", () => {
  const result = validateProduct({
    ...product,
    category: "Furniture > Seating > Dining chairs",
    categoryId: "category-1-2-1"
  });
  assert.equal(result.category, "Furniture > Seating > Dining chairs");
  assert.equal(result.categoryId, "category-1-2-1");
});

test("inquiry validation normalizes email and limits public submission type", () => {
  const result = validateInquiry({ email: " CUSTOMER@EXAMPLE.COM ", type: "admin", message: "Hello" });
  assert.equal(result.email, "customer@example.com");
  assert.equal(result.type, "contact");
});

test("inquiry validation rejects malformed email addresses", () => {
  assert.throws(() => validateInquiry({ email: "not-an-email" }), /valid email/);
});
