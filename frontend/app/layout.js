import "./globals.css";

export const metadata = {
  title: "Home Shape — thoughtful furniture for the everyday",
  description: "Thoughtful furniture and refined interior pieces for everyday living at Home Shape."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
        />
        <link rel="stylesheet" href="/legacy/styles.css" />
        <link rel="stylesheet" href="/legacy/customer-nav.css" />
        <link rel="stylesheet" href="/legacy/storefront-overrides.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
