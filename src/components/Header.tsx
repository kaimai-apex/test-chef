import Link from "next/link";
import { getPersona } from "@/lib/session";
import { PersonaSwitcher } from "./PersonaSwitcher";

export async function Header() {
  const persona = await getPersona();

  const navByPersona: Record<string, { href: string; label: string }[]> = {
    client: [
      { href: "/discover", label: "Discover" },
      { href: "/bookings", label: "My bookings" },
    ],
    chef: [
      { href: "/chef", label: "Dashboard" },
      { href: "/chef/requests", label: "Requests" },
      { href: "/chef/menus", label: "Menus" },
      { href: "/chef/earnings", label: "Earnings" },
    ],
    admin: [{ href: "/admin", label: "Admin console" }],
  };
  const nav = navByPersona[persona] ?? [];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta text-lg">🔥</span>
            <span className="text-xl font-bold tracking-tight">Hearth</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-sand hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <PersonaSwitcher persona={persona} />
      </div>
      <nav className="container-page flex items-center gap-1 overflow-x-auto pb-2 md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-sand"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
