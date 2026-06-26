import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBooking,
  getChef,
  getMenu,
  getMessages,
  getReviewsForBooking,
  getUser,
} from "@/lib/store";
import { getPersona, currentUserId } from "@/lib/session";
import { Photo, Avatar } from "@/components/Photo";
import { StatusPill } from "@/components/ui";
import { PriceBreakdown, PayoutBreakdown } from "@/components/PriceBreakdown";
import { MessageThread } from "@/components/MessageThread";
import { ReviewForm } from "@/components/ReviewForm";
import { BookingActions } from "@/components/BookingActions";
import { longDate, clock, money } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

const ESCROW_COPY: Record<string, string> = {
  authorized: "Card authorized — funds held pending chef confirmation",
  held: "Funds held in escrow — released after your dinner",
  released: "Payout released to chef",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const booking = getBooking(id);
  if (!booking) notFound();

  const persona = await getPersona();
  const viewerId = currentUserId(persona);
  const chef = getChef(booking.chefId)!;
  const menu = booking.menuId ? getMenu(booking.menuId) : undefined;
  const client = getUser(booking.clientId)!;
  const chefUser = getUser(chef.userId)!;
  const messages = getMessages(booking.id);
  const reviews = getReviewsForBooking(booking.id);

  const quote: Quote = {
    menuSubtotal: booking.menuSubtotal,
    travelFee: booking.travelFee,
    subtotal: booking.subtotal,
    serviceFee: booking.serviceFee,
    tax: booking.tax,
    totalCharged: booking.totalCharged,
    commission: booking.commission,
    chefPayout: booking.chefPayout,
    items: booking.items,
  };

  const isChefView = persona === "chef" && chef.id === "chef_ana";
  const myDirection = persona === "chef" ? "chef_to_client" : "client_to_chef";
  const alreadyReviewed = reviews.some((r) => r.direction === myDirection);
  const canReview = booking.status === "completed" && (persona === "client" || isChefView) && !alreadyReviewed;
  const visibleReviews = reviews.filter((r) => r.isVisible);

  const names: Record<string, string> = {
    [client.id]: client.fullName,
    [chefUser.id]: chef.displayName,
  };
  const seeds: Record<string, string> = {
    [client.id]: client.id,
    [chefUser.id]: chef.seed,
  };

  return (
    <div className="container-page max-w-5xl py-8">
      <Link href={persona === "chef" ? "/chef" : "/bookings"} className="text-sm text-muted hover:text-ink">
        ← Back
      </Link>

      {isNew && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <strong>Booking requested!</strong> Sent to {chef.displayName} — they&apos;ll confirm shortly.
          Your card is authorized and funds are held in escrow until after the dinner.
        </div>
      )}

      {/* Header */}
      <div className="card mt-3 overflow-hidden">
        <Photo seed={menu?.seed ?? chef.seed} className="h-40 w-full" rounded="rounded-none" />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{menu?.name ?? "Custom event"}</h1>
                <StatusPill status={booking.status} />
              </div>
              <p className="mt-1 text-muted">
                {longDate(booking.eventDate)} · {clock(booking.eventTime)} · {booking.guestCount} guests
              </p>
            </div>
            <BookingActions bookingId={booking.id} status={booking.status} persona={persona} />
          </div>

          {/* Who */}
          <div className="mt-5 flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Avatar seed={chef.seed} name={chef.displayName} size={40} />
              <div className="text-sm">
                <div className="text-muted">Chef</div>
                <Link href={`/chefs/${chef.id}`} className="font-semibold hover:underline">{chef.displayName}</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar seed={client.id} name={client.fullName} size={40} />
              <div className="text-sm">
                <div className="text-muted">Client</div>
                <div className="font-semibold">{client.fullName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* Allergies — first-class citizen (doc 02 UX rule) */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
            <div className="flex items-center gap-2 font-bold text-amber-900">⚠ Allergies & dietary needs</div>
            <p className="mt-2 text-amber-900">{booking.allergies}</p>
            {booking.dietaryNotes && <p className="mt-1 text-sm text-amber-800">Notes: {booking.dietaryNotes}</p>}
            {isChefView && booking.status !== "completed" && (
              <p className="mt-3 text-xs font-medium text-amber-700">
                As the chef, you must acknowledge allergies before service.
              </p>
            )}
          </div>

          {/* Details */}
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Event details</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Address" value={`${booking.address.street}${booking.address.unit ? `, ${booking.address.unit}` : ""}, ${booking.address.city}`} />
              <Detail label="Kitchen notes" value={booking.address.kitchenNotes ?? "—"} />
              <Detail label="Special requests" value={booking.specialRequests || "—"} />
              <Detail label="Booking ID" value={booking.id} />
            </dl>
          </div>

          {/* Messaging */}
          {viewerId && (
            <MessageThread
              bookingId={booking.id}
              messages={messages}
              currentUserId={viewerId}
              names={names}
              seeds={seeds}
            />
          )}

          {/* Reviews */}
          {visibleReviews.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 font-bold">Reviews</h3>
              <div className="space-y-4">
                {visibleReviews.map((r) => (
                  <div key={r.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {r.direction === "client_to_chef" ? client.fullName : chef.displayName}
                      </span>
                      <span className="text-gold text-sm">{"★".repeat(r.ratingFood ?? r.ratingCommunication ?? 5)}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink/90">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canReview && <ReviewForm bookingId={booking.id} asChef={isChefView} />}
          {booking.status === "completed" && alreadyReviewed && visibleReviews.length === 0 && (
            <p className="rounded-xl bg-sand px-4 py-3 text-sm text-muted">
              Thanks — your review is in. It stays hidden until the other side submits theirs (double-blind).
            </p>
          )}
        </div>

        {/* Money rail */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h3 className="mb-3 font-bold">{isChefView ? "Your payout" : "Price"}</h3>
            {isChefView ? <PayoutBreakdown quote={quote} /> : <PriceBreakdown quote={quote} />}
          </div>
          <div className="card p-4 text-sm">
            <div className="font-semibold">Payment</div>
            <p className="mt-1 text-muted">{ESCROW_COPY[booking.escrow] ?? booking.escrow}</p>
            {!isChefView && (
              <p className="mt-2 text-xs text-muted">You paid {money(booking.totalCharged)} all-in.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words">{value}</dd>
    </div>
  );
}
