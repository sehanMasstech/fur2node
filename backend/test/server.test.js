const test = require("node:test");
const assert = require("node:assert/strict");
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { app } = require("../server");

const server = app.listen(0);
const origin = new Promise((resolve) => server.once("listening", () => {
  resolve(`http://127.0.0.1:${server.address().port}`);
}));

test("API is configured for the local Next.js frontend origin", async () => {
  const response = await fetch(`${await origin}/api/health`, { headers: { Origin: "http://localhost:3000" } });
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
});

test("admin catalog endpoints require an authenticated session", async () => {
  const response = await fetch(`${await origin}/api/admin/products`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Please sign in to continue." });
});

test("admin API accepts a valid Bearer token", async () => {
  const token = jwt.sign({ sub: "test-admin", email: "admin@example.com" }, process.env.JWT_SECRET);
  const response = await fetch(`${await origin}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { email: "admin@example.com" });
});

test("Cloudinary upload signing requires configuration and never returns the API secret", async () => {
  const names = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const token = jwt.sign({ sub: "test-admin", email: "admin@example.com" }, process.env.JWT_SECRET);
  const url = `${await origin}/api/admin/cloudinary-signature`;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const unauthorized = await fetch(url, { method: "POST" });
    assert.equal(unauthorized.status, 401);

    names.forEach((name) => delete process.env[name]);
    const unavailable = await fetch(url, { method: "POST", headers });
    assert.equal(unavailable.status, 503);

    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";
    const response = await fetch(url, { method: "POST", headers });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(data.cloudName, "test-cloud");
    assert.equal(data.apiKey, "test-key");
    assert.equal(Object.hasOwn(data, "apiSecret"), false);
    assert.equal(
      data.signature,
      crypto.createHash("sha1")
        .update(`folder=${data.folder}&timestamp=${data.timestamp}test-secret`)
        .digest("hex")
    );
  } finally {
    names.forEach((name) => {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    });
  }
});

test("health endpoint responds without requiring a database connection", async () => {
  const response = await fetch(`${await origin}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
