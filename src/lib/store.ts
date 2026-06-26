// File-backed data store. This is the seam that a production build swaps for
// Supabase: every read/write goes through the functions below, so the pages and
// server actions never touch the storage mechanism directly. See db/schema.sql
// for the equivalent Postgres tables and README "Going to production".
import fs from "fs";
import os from "os";
import path from "path";
import type {
  Booking,
  ChefApplication,
  ChefProfile,
  DB,
  Menu,
  Message,
  Review,
  User,
  WaitlistEntry,
} from "./types";
import { freshSeed } from "./seed";

// Storage is an in-memory cache (the source of truth at runtime) with best-effort
// persistence to a writable dir. On Vercel/serverless the project dir is read-only,
// so we persist to the OS temp dir and never crash if even that is unavailable —
// the in-memory cache still serves the request. Data is per-instance and resets on
// a cold start; for durable, shared data use Supabase (see db/schema.sql + README).
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "hearth")
  : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
  } catch {
    cache = freshSeed();
    persist();
  }
  return cache;
}

function persist(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // read-only filesystem (some serverless runtimes) — in-memory cache is enough
  }
}

function read(): DB {
  return load();
}

function mutate<T>(fn: (db: DB) => T): T {
  const db = load();
  const result = fn(db);
  persist();
  return result;
}

export function resetStore(): void {
  cache = freshSeed();
  persist();
}

// ---- Reads -----------------------------------------------------------------

export function getUsers(): User[] {
  return read().users;
}
export function getUser(id: string): User | undefined {
  return read().users.find((u) => u.id === id);
}

export function getChefs(): ChefProfile[] {
  return read().chefs;
}
export function getApprovedChefs(): ChefProfile[] {
  return read().chefs.filter((c) => c.status === "approved");
}
export function getChef(id: string): ChefProfile | undefined {
  return read().chefs.find((c) => c.id === id);
}
export function getChefByUserId(userId: string): ChefProfile | undefined {
  return read().chefs.find((c) => c.userId === userId);
}

export function getMenus(): Menu[] {
  return read().menus;
}
export function getMenu(id: string): Menu | undefined {
  return read().menus.find((m) => m.id === id);
}
export function getMenusForChef(chefId: string): Menu[] {
  return read().menus.filter((m) => m.chefId === chefId);
}

export function getBookings(): Booking[] {
  return read().bookings;
}
export function getBooking(id: string): Booking | undefined {
  return read().bookings.find((b) => b.id === id);
}
export function getBookingsForClient(clientId: string): Booking[] {
  return read().bookings.filter((b) => b.clientId === clientId);
}
export function getBookingsForChef(chefId: string): Booking[] {
  return read().bookings.filter((b) => b.chefId === chefId);
}

export function getMessages(bookingId: string): Message[] {
  return read()
    .messages.filter((m) => m.bookingId === bookingId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getReviews(): Review[] {
  return read().reviews;
}
export function getReviewsForBooking(bookingId: string): Review[] {
  return read().reviews.filter((r) => r.bookingId === bookingId);
}
export function getVisibleReviewsForChef(chefId: string): Review[] {
  const db = read();
  const chefBookingIds = new Set(
    db.bookings.filter((b) => b.chefId === chefId).map((b) => b.id),
  );
  return db.reviews.filter(
    (r) =>
      r.direction === "client_to_chef" &&
      r.isVisible &&
      chefBookingIds.has(r.bookingId),
  );
}

export function getApplications(): ChefApplication[] {
  return read().applications;
}
export function getWaitlist(): WaitlistEntry[] {
  return read().waitlist;
}

// concrete dates already taken (confirmed-ish bookings) for a chef
export function takenDatesForChef(chefId: string): string[] {
  const active: Booking["status"][] = [
    "confirmed",
    "in_progress",
    "accepted",
  ];
  return read()
    .bookings.filter(
      (b) => b.chefId === chefId && active.includes(b.status),
    )
    .map((b) => b.eventDate);
}

// ---- Writes ----------------------------------------------------------------

export function addBooking(b: Booking): void {
  mutate((db) => db.bookings.push(b));
}

export function updateBooking(id: string, patch: Partial<Booking>): void {
  mutate((db) => {
    const b = db.bookings.find((x) => x.id === id);
    if (b) Object.assign(b, patch);
  });
}

export function addMessage(m: Message): void {
  mutate((db) => db.messages.push(m));
}

export function addReview(r: Review): void {
  mutate((db) => {
    db.reviews.push(r);
    // double-blind: flip both directions visible once both sides submitted
    const forBooking = db.reviews.filter((x) => x.bookingId === r.bookingId);
    const hasClient = forBooking.some((x) => x.direction === "client_to_chef");
    const hasChef = forBooking.some((x) => x.direction === "chef_to_client");
    if (hasClient && hasChef) {
      forBooking.forEach((x) => (x.isVisible = true));
    }
    // recompute the chef's denormalized rating from visible client reviews
    const booking = db.bookings.find((x) => x.id === r.bookingId);
    if (booking) recomputeChefRating(db, booking.chefId);
  });
}

function recomputeChefRating(db: DB, chefId: string): void {
  const chefBookingIds = new Set(
    db.bookings.filter((b) => b.chefId === chefId).map((b) => b.id),
  );
  const rels = db.reviews.filter(
    (r) =>
      r.direction === "client_to_chef" &&
      r.isVisible &&
      chefBookingIds.has(r.bookingId) &&
      typeof r.ratingFood === "number",
  );
  const chef = db.chefs.find((c) => c.id === chefId);
  if (!chef || rels.length === 0) return;
  const avg =
    rels.reduce((sum, r) => {
      const axes = [
        r.ratingFood,
        r.ratingPresentation,
        r.ratingProfessionalism,
        r.ratingCommunication,
      ].filter((n): n is number => typeof n === "number");
      return sum + axes.reduce((a, b) => a + b, 0) / axes.length;
    }, 0) / rels.length;
  chef.ratingAvg = Math.round(avg * 10) / 10;
  chef.ratingCount = rels.length;
}

export function addApplication(a: ChefApplication): void {
  mutate((db) => db.applications.push(a));
}

export function approveApplication(appId: string): void {
  mutate((db) => {
    const app = db.applications.find((a) => a.id === appId);
    if (app) app.status = "approved";
  });
}

export function approveChef(chefId: string): void {
  mutate((db) => {
    const chef = db.chefs.find((c) => c.id === chefId);
    if (chef) {
      chef.status = "approved";
      chef.foodSafetyCertVerified = true;
      chef.insuranceVerified = true;
      chef.idVerified = true;
      chef.stripeAccountId = chef.stripeAccountId ?? `acct_demo_${chef.id}`;
      chef.stripePayoutsEnabled = true;
      const menu = db.menus.find((m) => m.chefId === chefId);
      if (menu) menu.isActive = true;
    }
  });
}

export function addWaitlist(w: WaitlistEntry): void {
  mutate((db) => db.waitlist.push(w));
}
