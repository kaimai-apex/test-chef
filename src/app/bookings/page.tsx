import Link from "next/link";
import { getBookingsForClient, getChef, getMenu } from "@/lib/store";
import { getPersona, currentUserId } from "@/lib/session";
import { Photo } from "@/components/Photo";
import { StatusPill, Empty } from "@/components/ui";
import { isUpcoming } from "@/lib/booking";
import { money, shortDate } from "@/lib/format";

export default async function BookingsPage() {
  const persona = await getPersona();
  const userId = currentUserId(persona);

  if (persona !== "client" || !userId) {
    return (
      <div className="container-page py-10">
        <Empty
          title="Switch to the client persona"
          body="This is the client's bookings list. Use the persona switcher (top right) to view as Jordan Lee."
          cta={{ href: "/chef", label: "Go to chef dashboard" }}
        />
      </div>
    );
  }

  const all = getBookingsForClient(userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const upcoming = all.filter((b) => isUpcoming(b.status));
  const past = all.filter((b) => !isUpcoming(b.status));

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">My bookings</h1>

      <Group title="Upcoming" bookings={upcoming} empty="No upcoming dinners — find a chef to get cooking." />
      <Group title="Past" bookings={past} empty="No past bookings yet." />
    </div>
  );
}

function Group({
  title,
  bookings,
  empty,
}: {
  title: string;
  bookings: ReturnType<typeof getBookingsForClient>;
  empty: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {bookings.length === 0 ? (
        title === "Upcoming" ? (
          <Empty title="Nothing on the calendar" body={empty} cta={{ href: "/discover", label: "Browse chefs" }} />
        ) : (
          <p className="text-sm text-muted">{empty}</p>
        )
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const chef = getChef(b.chefId);
            const menu = b.menuId ? getMenu(b.menuId) : undefined;
            return (
              <Link key={b.id} href={`/bookings/${b.id}`} className="card flex items-center gap-4 p-3 hover:shadow-sm">
                <Photo seed={menu?.seed ?? chef?.seed ?? b.id} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold">{menu?.name ?? "Custom event"}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {chef?.displayName} · {shortDate(b.eventDate)} · {b.guestCount} guests
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{money(b.totalCharged)}</div>
                  <div className="text-xs text-muted">total</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
