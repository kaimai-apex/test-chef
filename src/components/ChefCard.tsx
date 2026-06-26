import Link from "next/link";
import type { ChefProfile } from "@/lib/types";
import { Photo } from "./Photo";
import { Stars } from "./ui";
import { money, shortDate } from "@/lib/format";

export function ChefCard({
  chef,
  fromPrice,
  nextDate,
  signatureMenu,
}: {
  chef: ChefProfile;
  fromPrice: number;
  nextDate?: string;
  signatureMenu?: string;
}) {
  return (
    <Link
      href={`/chefs/${chef.id}`}
      className="card group overflow-hidden transition-shadow hover:shadow-md"
    >
      <Photo seed={chef.seed} className="aspect-[4/3] w-full" rounded="rounded-none" label={signatureMenu} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold leading-tight">{chef.displayName}</h3>
            <p className="mt-0.5 text-sm text-muted">{chef.cuisines.join(" · ")}</p>
          </div>
          {chef.ratingCount > 0 && <Stars value={chef.ratingAvg} count={chef.ratingCount} />}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">{chef.neighborhood}</span>
          <span className="font-semibold">
            from {money(fromPrice)}
            <span className="font-normal text-muted">/guest</span>
          </span>
        </div>
        {nextDate && (
          <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Available {shortDate(nextDate)}
          </div>
        )}
      </div>
    </Link>
  );
}
