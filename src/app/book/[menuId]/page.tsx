import Link from "next/link";
import { notFound } from "next/navigation";
import { getChef, getMenu, takenDatesForChef } from "@/lib/store";
import { availableDates } from "@/lib/availability";
import { getPersona } from "@/lib/session";
import { BookingFlow } from "@/components/BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ menuId: string }>;
}) {
  const { menuId } = await params;
  const menu = getMenu(menuId);
  if (!menu) notFound();
  const chef = getChef(menu.chefId);
  if (!chef) notFound();

  const persona = await getPersona();
  const dates = availableDates(chef, takenDatesForChef(chef.id));

  return (
    <div className="container-page py-8">
      <Link href={`/chefs/${chef.id}`} className="text-sm text-muted hover:text-ink">
        ← Back to {chef.displayName}
      </Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold">Book {menu.name}</h1>

      {persona !== "client" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You&apos;re viewing as <strong>{persona}</strong>. Booking is a client action —
          switch to the client persona (top right) to complete a booking.
        </div>
      )}

      <BookingFlow chef={chef} menu={menu} dates={dates} />
    </div>
  );
}
