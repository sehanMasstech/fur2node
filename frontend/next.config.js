/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/furniture.html", destination: "/furniture" },
      { source: "/product.html", destination: "/product" },
      { source: "/pages.html", destination: "/pages" },
      { source: "/admin.html", destination: "/admin" }
    ];
  }
};

module.exports = nextConfig;
