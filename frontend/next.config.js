/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/furniture.html", destination: "/furniture", permanent: true },
      { source: "/product.html", destination: "/product", permanent: true },
      { source: "/pages.html", destination: "/pages", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/account.html", destination: "/account", permanent: true },
      { source: "/checkout.html", destination: "/checkout", permanent: true },
      { source: "/compare.html", destination: "/compare", permanent: true },
      { source: "/wishlist.html", destination: "/wishlist", permanent: true }
    ];
  }
};

module.exports = nextConfig;
