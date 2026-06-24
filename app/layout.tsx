import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/projects";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ali Almusawi — Architecture Portfolio",
  description: "Bachelor of Architecture, UTS. Selected works.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cover, contact } = getSiteContent();

  return (
    <html lang="en">
      <body>
        <header className="site-header container">
          <Link href="/" className="brand">
            {cover.title}
          </Link>
          <div className="meta">{cover.subtitle}</div>
        </header>

        <main>{children}</main>

        <footer className="site-footer container">{contact}</footer>
      </body>
    </html>
  );
}
