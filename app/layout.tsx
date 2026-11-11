import "./globals.css";
import Nav from "@/components/Nav";
import Link from "next/link";

export const metadata = {
  title: {
    default: "1960.com | Made in Nigeria. Loved everywhere.",
    template: "%s | 1960.com",
  },
  description:
    "Discover Nigerian products, connect with suppliers, compare quotations and coordinate international logistics. A marketplace for the diaspora and global buyers, inspired by Nigeria's independence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Nav />
        <main id="main-content">{children}</main>
        <footer>
          <div className="footer-top">
            <div>
              <Link className="brand" href="/">
                1960<span>.com</span>
              </Link>
              <p>Our roots. Our richness. Our marketplace.</p>
            </div>
            <div className="footer-links">
              <Link href="/about">About 1960.com</Link>
              <Link href="/guide">Buying & shipping guide</Link>
              <Link href="/suppliers">Find suppliers</Link>
              <Link href="/providers">Logistics partners</Link>
              <Link href="/login?mode=signup&role=supplier">Sell with us</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Inspired by 1 October 1960. Made for what comes next.</span>
            <span>
              Supplier verification is a marketplace review. Product and
              destination approvals must be confirmed for each shipment.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
