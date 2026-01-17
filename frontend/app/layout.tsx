import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <main className="min-h-screen p-4 sm:p-6">{children}</main>
      </body>
    </html>
  );
}
