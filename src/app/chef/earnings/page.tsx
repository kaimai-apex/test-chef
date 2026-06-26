import Link from "next/link";
import { getBookingsForChef, getChef, getMenu } from "@/lib/store";
import { getPersona, PERSONA_CHEF_ID } from "@/lib/session";
import { Stat, Empty, VerifiedBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function EarningsPage() {
  const persona = await getPersona();
  if (persona !== "chef") {
    return (
      <div className="container-page py-10">
        <Empty title="Chef only" body="Switch to the chef persona to see earnings." cta={{ href: "/discover", label: "Browse as a client" }} />
      </div>
    );
  }

  const chef = getChef(PERSONA_CHEF_ID)!;
  const bookings = getBookingsForChef(chef.id);
  const completed = bookings.filter((b) => b.status === "completed");
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "in_progress");

  const paid = completed.filter((b) => b.escrow === "released").reduce((s, b) => s + b.chefPayout, 0);
  const pending = confirmed.reduce((s, b) => s + b.chefPayout, 0);
  const lifetimeGross = completed.reduce((s, b) => s + b.subtotal, 0);
  const lifetimeCommission = completed.reduce((s, b) => s + b.commission, 0);

  const ledger = [...completed, ...confirmed].sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return (
    <div className="container-page max-w-4xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Earnings</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Stripe Connect</span>
          {chef.stripePayoutsEnabled ? <VerifiedBadge /> : <span className="chip">Setup needed</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Available / paid" value={money(paid)} sub="released to your bank" />
        <Stat label="Pending payout" value={money(pending)} sub="confirmed, not yet released" />
        <Stat label="Lifetime gross" value={money(lifetimeGross)} sub={`${money(lifetimeCommission)} commission`} />
      </div>

      <div className="mt-6 card p-4 text-sm text-muted">
        Payouts are batched <strong className="text-ink">weekly</strong> with an itemized statement
        (gross, commission, net). Funds release ~24–48h after each completed dinner. (doc 03)
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Payout ledger</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-sand/50 text-left text-xs uppercase text-muted">
                <th className="px-4 py-3 font-semibold">Dinner</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Gross</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
                <th className="px-4 py-3 text-right font-semibold">Net payout</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((b) => {
                const menu = b.menuId ? getMenu(b.menuId) : undefined;
                return (
                  <tr key={b.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${b.id}`} className="font-medium hover:underline">{menu?.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{shortDate(b.eventDate)}</td>
                    <td className="px-4 py-3 text-right">{money(b.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-muted">– {money(b.commission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">{money(b.chefPayout)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.escrow === "released" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {b.escrow === "released" ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {ledger.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No earnings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
