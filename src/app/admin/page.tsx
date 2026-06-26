import Link from "next/link";
import {
  getApplications,
  getBookings,
  getChef,
  getChefs,
  getMenu,
  getUser,
  getWaitlist,
} from "@/lib/store";
import { getPersona } from "@/lib/session";
import { Stat, StatusPill, Empty } from "@/components/ui";
import { Avatar } from "@/components/Photo";
import { ApproveChefButton, ApproveApplicationButton, RefundButton } from "@/components/AdminActions";
import { money, shortDate } from "@/lib/format";
import { COMMISSION_RATE, SERVICE_FEE_RATE } from "@/lib/pricing";

export default async function AdminConsole() {
  const persona = await getPersona();
  if (persona !== "admin") {
    return (
      <div className="container-page py-10">
        <Empty title="Admin only" body="Switch to the Admin persona (top right) to open the ops console." cta={{ href: "/discover", label: "Browse the marketplace" }} />
      </div>
    );
  }

  const chefs = getChefs();
  const bookings = getBookings();
  const applications = getApplications();
  const waitlist = getWaitlist();

  const activeChefs = chefs.filter((c) => c.status === "approved");
  const pendingChefs = chefs.filter((c) => c.status === "pending");
  const realized = bookings.filter((b) => b.status === "completed");
  const gmv = realized.reduce((s, b) => s + b.subtotal, 0);
  const netTake = realized.reduce((s, b) => s + b.serviceFee + b.commission, 0);
  const liveBookings = bookings.filter((b) => ["requested", "confirmed", "in_progress"].includes(b.status));

  // match a pending chef to its application (by email)
  const appByEmail = new Map(applications.map((a) => [a.email, a]));
  const rawApps = applications.filter(
    (a) => a.status === "submitted" && !chefs.some((c) => getUser(c.userId)?.email === a.email),
  );

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Admin console</h1>
      <p className="mt-1 text-muted">Marketplace health, the chef approval queue, and booking oversight.</p>

      {/* Dashboard */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV (completed)" value={money(gmv)} sub={`${realized.length} dinners`} />
        <Stat label="Net take" value={money(netTake)} sub={`${Math.round((COMMISSION_RATE + SERVICE_FEE_RATE) * 100)}% blended`} />
        <Stat label="Active chefs" value={String(activeChefs.length)} sub={`${pendingChefs.length} pending`} />
        <Stat label="Live bookings" value={String(liveBookings.length)} sub="in flight" />
      </div>

      {/* Approval queue */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">Chef approval queue</h2>
        {pendingChefs.length === 0 && rawApps.length === 0 ? (
          <p className="text-sm text-muted">No applications waiting. Nice and clear.</p>
        ) : (
          <div className="space-y-4">
            {pendingChefs.map((chef) => {
              const user = getUser(chef.userId);
              const app = user ? appByEmail.get(user.email) : undefined;
              return (
                <div key={chef.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar seed={chef.seed} name={chef.displayName} size={48} />
                      <div>
                        <div className="font-bold">{chef.displayName}</div>
                        <div className="text-sm text-muted">{chef.cuisines.join(", ")} · {chef.neighborhood}</div>
                      </div>
                    </div>
                    <ApproveChefButton chefId={chef.id} appId={app?.id} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <VerifyChip ok={chef.foodSafetyCertVerified} label="Food-safety cert" />
                    <VerifyChip ok={chef.insuranceVerified} label="Liability insurance" />
                    <VerifyChip ok={chef.idVerified} label="ID verified" />
                    <VerifyChip ok={chef.stripePayoutsEnabled} label="Stripe payouts" />
                  </div>
                  {app && (
                    <p className="mt-3 text-sm text-muted">
                      “{app.about}” · {app.yearsCooking} yrs · cert: {app.hasFoodSafetyCert.replace("_", " ")} · insurance: {app.hasInsurance.replace("_", " ")}
                    </p>
                  )}
                </div>
              );
            })}

            {rawApps.map((app) => (
              <div key={app.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar seed={app.email} name={app.name} size={48} />
                    <div>
                      <div className="font-bold">{app.name}</div>
                      <div className="text-sm text-muted">{app.cuisines} · {app.city}</div>
                    </div>
                  </div>
                  <ApproveApplicationButton appId={app.id} />
                </div>
                <p className="mt-3 text-sm text-muted">
                  “{app.about}” · {app.yearsCooking} yrs · cert: {app.hasFoodSafetyCert.replace("_", " ")} · insurance: {app.hasInsurance.replace("_", " ")} · {app.email}
                </p>
                <p className="mt-1 text-xs text-muted">No chef profile yet — create one during onboarding after approval.</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookings table */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">Bookings</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-sand/50 text-left text-xs uppercase text-muted">
                <th className="px-4 py-3 font-semibold">Dinner</th>
                <th className="px-4 py-3 font-semibold">Chef</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .slice()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((b) => {
                  const chef = getChef(b.chefId);
                  const client = getUser(b.clientId);
                  const menu = b.menuId ? getMenu(b.menuId) : undefined;
                  return (
                    <tr key={b.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/bookings/${b.id}`} className="font-medium hover:underline">{menu?.name ?? "Custom"}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{chef?.displayName}</td>
                      <td className="px-4 py-3 text-muted">{client?.fullName}</td>
                      <td className="px-4 py-3 text-muted">{shortDate(b.eventDate)}</td>
                      <td className="px-4 py-3 text-right">{money(b.totalCharged)}</td>
                      <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {["completed", "confirmed", "in_progress", "disputed"].includes(b.status) ? (
                          <RefundButton bookingId={b.id} />
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Waitlist */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">City waitlist ({waitlist.length})</h2>
        <div className="card divide-y divide-line">
          {waitlist.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{w.email}</span>
              <span className="text-muted">{w.city}</span>
            </div>
          ))}
          {waitlist.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">No signups yet.</div>}
        </div>
      </section>
    </div>
  );
}

function VerifyChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
