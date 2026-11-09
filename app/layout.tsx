import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "NaijaBulk Marketplace | Everything Nigerian. Delivered Worldwide.",
  description: "Nigerian food, agricultural commodities, natural products and fashion. Buy one pack or an entire container from Nigerian suppliers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <footer>Verification is reviewed by NaijaBulk staff. Official export approvals remain with the relevant Nigerian authorities.</footer>
      </body>
    </html>
  );
}
