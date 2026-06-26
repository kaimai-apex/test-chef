import { getMenusForChef } from "@/lib/store";
import { getPersona, PERSONA_CHEF_ID } from "@/lib/session";
import { Photo } from "@/components/Photo";
import { Empty } from "@/components/ui";
import { money } from "@/lib/format";

export default async function MenuManager() {
  const persona = await getPersona();
  if (persona !== "chef") {
    return (
      <div className="container-page py-10">
        <Empty title="Chef only" body="Switch to the chef persona to manage menus." cta={{ href: "/discover", label: "Browse as a client" }} />
      </div>
    );
  }

  const menus = getMenusForChef(PERSONA_CHEF_ID);

  return (
    <div className="container-page max-w-4xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your menus</h1>
          <p className="mt-1 text-muted">You set your menus and prices. We&apos;re the rails.</p>
        </div>
        <button className="btn-primary" disabled title="Co-founder-assisted at launch (doc 04)">
          + New menu
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {menus.map((menu) => (
          <div key={menu.id} className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <Photo seed={menu.seed} className="h-36 w-full sm:h-auto sm:w-44 sm:shrink-0" rounded="rounded-none" />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{menu.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${menu.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand text-muted"}`}>
                        {menu.isActive ? "Live" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{menu.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{money(menu.pricePerGuest)}</div>
                    <div className="text-xs text-muted">/guest</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                  <span>{menu.minGuests}–{menu.maxGuests} guests</span>
                  <span>{menu.courses.length} courses</span>
                  {menu.dietaryTags.length > 0 && <span>{menu.dietaryTags.join(", ")}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
