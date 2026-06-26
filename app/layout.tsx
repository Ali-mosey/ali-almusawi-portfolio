import type { Metadata } from "next";
import { getSiteContent } from "@/lib/projects";
import BouncingBuilding from "@/components/BouncingBuilding";
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
        <BouncingBuilding />

        <header className="site-header container">
          <div className="meta">{cover.subtitle}</div>
        </header>

        <main>{children}</main>

        <footer className="site-footer container">{contact}</footer>
      </body>
    </html>
  );
}
