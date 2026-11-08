import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "NaijaBulk | Nigerian commodities, bought in bulk",
  description: "B2B marketplace connecting international buyers with Nigerian suppliers of cocoa, cashew, sesame, ginger and more.",
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
