import Link from "next/link";
import { getBookingsForChef, getChef, getMenu, getVisibleReviewsForChef } from "@/lib/store";
import { getPersona } from "@/lib/session";
import { PERSONA_CHEF_ID } from "@/lib/session";
import { Photo } from "@/components/Photo";
import { StatusPill, Stat, Stars, Empty } from "@/components/ui";
import { isUpcoming } from "@/lib/booking";
import { money, shortDate, clock } from "@/lib/format";

export default async function ChefDashboard() {
  const persona = await getPersona();
  if (persona !== "chef") {
    return (
      <div className="container-page py-10">
        <Empty
          title="Switch to the chef persona"
          body="This is the chef-side dashboard. Use the persona switcher (top right) to view as Ana Reyes."
          cta={{ href: "/discover", label: "Browse as a client" }}
        />
      </div>
    );
  }

  const chef = getChef(PERSONA_CHEF_ID)!;
  const bookings = getBookingsForChef(chef.id).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const pending = bookings.filter((b) => b.status === "requested");
  const upcoming = bookings.filter((b) => isUpcoming(b.status) && b.status !== "requested");
  const completed = bookings.filter((b) => b.status === "completed");
  const lifetimePayout = completed.reduce((s, b) => s + b.chefPayout, 0);
  const reviews = getVisibleReviewsForChef(chef.id);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {chef.displayName.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">Respond fast — quick responses rank you higher and win more bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          {chef.ratingCount > 0 && <Stars value={chef.ratingAvg} count={chef.ratingCount} />}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Pending requests" value={String(pending.length)} sub="need a response" />
        <Stat label="Upcoming dinners" value={String(upcoming.length)} />
        <Stat label="Completed" value={String(completed.length)} />
        <Stat label="Lifetime payout" value={money(lifetimePayout)} sub="net of commission" />
      </div>

      {/* Pending requests — the respond-fast nudge */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Requests needing a response</h2>
          <Link href="/chef/requests" className="text-sm font-semibold text-terracotta hover:underline">
            Open inbox →
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">All caught up — no pending requests.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((b) => {
              const menu = b.menuId ? getMenu(b.menuId) : undefined;
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="card flex items-center gap-4 border-amber-200 bg-amber-50/40 p-3 hover:shadow-sm">
                  <Photo seed={menu?.seed ?? b.id} className="h-14 w-14 shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold">{menu?.name}</div>
                    <div className="text-sm text-muted">{shortDate(b.eventDate)} · {clock(b.eventTime)} · {b.guestCount} guests</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-success">+{money(b.chefPayout)}</div>
                    <div className="text-xs text-muted">payout</div>
                  </div>
                  <StatusPill status={b.status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">Upcoming schedule</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Nothing booked yet.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => {
              const menu = b.menuId ? getMenu(b.menuId) : undefined;
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="card flex items-center gap-4 p-3 hover:shadow-sm">
                  <Photo seed={menu?.seed ?? b.id} className="h-14 w-14 shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold">{menu?.name}</div>
                    <div className="text-sm text-muted">{shortDate(b.eventDate)} · {clock(b.eventTime)} · {b.guestCount} guests</div>
                  </div>
                  <StatusPill status={b.status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Recent reviews</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="card p-4">
                <div className="text-gold text-sm">{"★".repeat(r.ratingFood ?? 5)}</div>
                <p className="mt-1 text-sm text-ink/90">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
