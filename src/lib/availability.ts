import type { ChefProfile } from "./types";

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Concrete open dates for a chef, computed from recurring weekly availability
 * + lead time − blocked dates − dates already taken by confirmed bookings.
 * (In production this is a transactional check against the bookings table; see
 * doc 05 "Availability & booking integrity".)
 */
export function availableDates(
  chef: ChefProfile,
  takenDates: string[] = [],
  horizonDays = 45,
): string[] {
  const out: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + chef.leadTimeDays);

  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISO(d);
    if (!chef.availabilityWeekdays.includes(d.getDay())) continue;
    if (chef.blockedDates.includes(iso)) continue;
    if (takenDates.includes(iso)) continue;
    out.push(iso);
  }
  return out;
}
