import Link from "next/link";
import { getApprovedChefs, getMenusForChef, takenDatesForChef } from "@/lib/store";
import { availableDates } from "@/lib/availability";
import { ChefCard } from "@/components/ChefCard";
import { Empty } from "@/components/ui";
import { LAUNCH_CITY } from "@/lib/pricing";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; party?: string; maxPrice?: string }>;
}) {
  const sp = await searchParams;
  const party = sp.party ? Number(sp.party) : undefined;
  const cuisine = sp.cuisine;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  const chefs = getApprovedChefs();
  const allCuisines = Array.from(new Set(chefs.flatMap((c) => c.cuisines))).sort();

  const rows = chefs
    .map((chef) => {
      const menus = getMenusForChef(chef.id).filter((m) => m.isActive);
      const fromPrice = menus.length ? Math.min(...menus.map((m) => m.pricePerGuest)) : Infinity;
      const dates = availableDates(chef, takenDatesForChef(chef.id));
      return { chef, menus, fromPrice, nextDate: dates[0], signatureMenu: menus[0]?.name };
    })
    .filter((r) => r.menus.length > 0)
    .filter((r) => (cuisine ? r.chef.cuisines.includes(cuisine) : true))
    .filter((r) => (party ? r.chef.maxPartySize >= party && r.menus.some((m) => party >= m.minGuests && party <= m.maxGuests) : true))
    .filter((r) => (maxPrice ? r.fromPrice <= maxPrice : true))
    .sort((a, b) => b.chef.ratingAvg - a.chef.ratingAvg);

  return (
    <div className="container-page py-8">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Private chefs in {LAUNCH_CITY}</h1>
          <p className="mt-1 text-muted">When and how many? Availability is the scarcest resource — start there.</p>
        </div>
      </div>

      {/* Filter bar (GET form → SSR filtering) */}
      <form className="card mt-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label" htmlFor="party">Party size</label>
          <select id="party" name="party" defaultValue={sp.party ?? ""} className="input min-w-[7rem]">
            <option value="">Any</option>
            {[2, 4, 6, 8, 10, 12, 16].map((n) => (
              <option key={n} value={n}>{n} guests</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cuisine">Cuisine</label>
          <select id="cuisine" name="cuisine" defaultValue={cuisine ?? ""} className="input min-w-[10rem]">
            <option value="">Any cuisine</option>
            {allCuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="maxPrice">Max per guest</label>
          <select id="maxPrice" name="maxPrice" defaultValue={sp.maxPrice ?? ""} className="input min-w-[9rem]">
            <option value="">Any price</option>
            {[80, 100, 120, 150].map((n) => (
              <option key={n} value={n}>Up to ${n}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Apply filters</button>
        {(cuisine || party || maxPrice) && (
          <Link href="/discover" className="btn-ghost">Clear</Link>
        )}
        <span className="ml-auto self-center text-sm text-muted">
          {rows.length} chef{rows.length === 1 ? "" : "s"}
        </span>
      </form>

      <div className="mt-6">
        {rows.length === 0 ? (
          <Empty
            title="No chefs match those filters yet"
            body="In a real launch, an empty result routes you to 'Request a custom menu' so a chef can quote your event — never a dead end. For now, try widening your filters."
            cta={{ href: "/discover", label: "Clear filters" }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <ChefCard
                key={r.chef.id}
                chef={r.chef}
                fromPrice={r.fromPrice}
                nextDate={r.nextDate}
                signatureMenu={r.signatureMenu}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
