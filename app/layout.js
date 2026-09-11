import "./globals.css";

export const metadata = {
  title: "POS Billing & Kitchen Operations",
  description: "Next.js POS Billing Web Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
