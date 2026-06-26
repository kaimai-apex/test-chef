import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChef,
  getMenusForChef,
  getVisibleReviewsForChef,
  takenDatesForChef,
} from "@/lib/store";
import { availableDates } from "@/lib/availability";
import { Photo, Avatar } from "@/components/Photo";
import { Stars, VerifiedBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function ChefProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chef = getChef(id);
  if (!chef || chef.status !== "approved") notFound();

  const menus = getMenusForChef(chef.id).filter((m) => m.isActive);
  const reviews = getVisibleReviewsForChef(chef.id);
  const dates = availableDates(chef, takenDatesForChef(chef.id)).slice(0, 8);
  const verified = chef.foodSafetyCertVerified && chef.insuranceVerified && chef.idVerified;

  return (
    <div>
      <Photo seed={chef.seed} className="h-56 w-full sm:h-72" rounded="rounded-none" />
      <div className="container-page -mt-12 pb-12">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar seed={chef.seed} name={chef.displayName} size={64} />
              <div>
                <h1 className="text-2xl font-bold">{chef.displayName}</h1>
                <p className="text-muted">{chef.tagline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {chef.ratingCount > 0 && <Stars value={chef.ratingAvg} count={chef.ratingCount} />}
                  <span className="text-sm text-muted">· {chef.bookingsCompleted} bookings completed</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {verified && <VerifiedBadge />}
              <span className="text-sm text-muted">{chef.neighborhood} · travels {chef.serviceRadiusKm} km</span>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-ink/90">{chef.bio}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {chef.cuisines.map((c) => (
              <span key={c} className="chip">{c}</span>
            ))}
            {chef.dietarySpecialties.map((d) => (
              <span key={d} className="chip bg-emerald-50 text-emerald-700">{d}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Menus */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold">Set menus</h2>
            <div className="space-y-5">
              {menus.map((menu) => (
                <div key={menu.id} className="card overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <Photo seed={menu.seed} className="h-40 w-full sm:h-auto sm:w-48 sm:shrink-0" rounded="rounded-none" />
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{menu.name}</h3>
                          <p className="mt-1 text-sm text-muted">{menu.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{money(menu.pricePerGuest)}</div>
                          <div className="text-xs text-muted">/guest</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {menu.courses.map((course) => (
                          <div key={course.name} className="text-sm">
                            <div className="font-semibold">{course.name}</div>
                            <div className="text-muted">{course.dishes.join(", ")}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm text-muted">
                          {menu.minGuests}–{menu.maxGuests} guests
                          {menu.dietaryTags.length > 0 && <> · {menu.dietaryTags.join(", ")}</>}
                        </span>
                        <Link href={`/book/${menu.id}`} className="btn-primary">
                          Book this menu
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: availability + reviews */}
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-bold">Next available</h3>
              {dates.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Fully booked on the near horizon — request a custom date.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <span key={d} className="chip bg-emerald-50 text-emerald-700">{shortDate(d)}</span>
                  ))}
                </div>
              )}
              <Link href={`/book/${menus[0]?.id}`} className="btn-outline mt-4 w-full">
                Check a date &amp; book
              </Link>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Reviews</h3>
                {chef.ratingCount > 0 && <Stars value={chef.ratingAvg} count={chef.ratingCount} />}
              </div>
              <div className="mt-4 space-y-4">
                {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
                {reviews.slice(0, 4).map((r) => (
                  <div key={r.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="text-gold text-sm" aria-hidden>
                      {"★".repeat(r.ratingFood ?? 5)}
                    </div>
                    <p className="mt-1 text-sm text-ink/90">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
