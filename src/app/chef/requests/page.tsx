import Link from "next/link";
import { getBookingsForChef, getMenu, getUser } from "@/lib/store";
import { getPersona, PERSONA_CHEF_ID } from "@/lib/session";
import { Photo } from "@/components/Photo";
import { Empty } from "@/components/ui";
import { BookingActions } from "@/components/BookingActions";
import { money, shortDate, clock } from "@/lib/format";

export default async function RequestsInbox() {
  const persona = await getPersona();
  if (persona !== "chef") {
    return (
      <div className="container-page py-10">
        <Empty title="Chef only" body="Switch to the chef persona (top right) to see the requests inbox." cta={{ href: "/discover", label: "Browse as a client" }} />
      </div>
    );
  }

  const bookings = getBookingsForChef(PERSONA_CHEF_ID);
  const requests = bookings
    .filter((b) => b.status === "requested")
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-bold">Requests inbox</h1>
      <p className="mt-1 text-muted">Accept to confirm and capture payment, or decline to refund the client.</p>

      <div className="mt-6 space-y-4">
        {requests.length === 0 && (
          <Empty title="No pending requests" body="When a client books one of your menus, it lands here. Fast responses rank you higher." />
        )}
        {requests.map((b) => {
          const menu = b.menuId ? getMenu(b.menuId) : undefined;
          const client = getUser(b.clientId);
          return (
            <div key={b.id} className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <Photo seed={menu?.seed ?? b.id} className="h-32 w-full sm:h-auto sm:w-40 sm:shrink-0" rounded="rounded-none" />
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/bookings/${b.id}`} className="text-lg font-bold hover:underline">{menu?.name}</Link>
                      <div className="text-sm text-muted">
                        {client?.fullName} · {shortDate(b.eventDate)} · {clock(b.eventTime)} · {b.guestCount} guests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success">+{money(b.chefPayout)}</div>
                      <div className="text-xs text-muted">your payout</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    ⚠ Allergies: {b.allergies}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {b.address.street}, {b.address.city}
                    {b.specialRequests ? ` · ${b.specialRequests}` : ""}
                  </div>

                  <div className="mt-4">
                    <BookingActions bookingId={b.id} status={b.status} persona={persona} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
