import "./globals.css";

export const metadata = {
  title: "AgriTrust — Supply Chain Dashboard",
  description:
    "Retailer dashboard for verifying agricultural produce batches and tracking supply chain provenance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
