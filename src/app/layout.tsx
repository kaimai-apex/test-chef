import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Hearth — A private chef in your home",
  description:
    "Browse vetted local private chefs, see real menus and prices, and book a chef for your next dinner. Built by a chef, for chefs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-line bg-sand/40">
          <div className="container-page flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded bg-terracotta text-xs">🔥</span>
              <span className="font-semibold text-ink">Hearth</span>
              <span>· Private chef marketplace</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/" className="hover:text-ink">For clients</Link>
              <Link href="/apply" className="hover:text-ink">For chefs</Link>
              <Link href="/discover" className="hover:text-ink">Discover</Link>
              <span>Demo build · Austin</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
