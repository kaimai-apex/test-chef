"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addApplication,
  addBooking,
  addMessage,
  addReview,
  addWaitlist,
  approveApplication,
  approveChef as approveChefStore,
  getBooking,
  getChef,
  getMenu,
  resetStore,
  updateBooking,
} from "./store";
import { computeQuote } from "./pricing";
import { getPersona, setPersona, currentUserId, PERSONA_CHEF_ID } from "./session";
import type { Booking, Persona } from "./types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---- Persona switch (demo auth) -------------------------------------------

export async function switchPersona(persona: Persona): Promise<void> {
  await setPersona(persona);
  revalidatePath("/", "layout");
}

// ---- Client: create a booking (instant-book) ------------------------------

export interface CreateBookingInput {
  menuId: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  street: string;
  unit: string;
  city: string;
  kitchenNotes: string;
  allergies: string;
  dietaryNotes: string;
  specialRequests: string;
}

export async function createBooking(input: CreateBookingInput): Promise<void> {
  const persona = await getPersona();
  const clientId = currentUserId(persona);
  if (!clientId) throw new Error("Sign in as a client to book.");

  const menu = getMenu(input.menuId);
  if (!menu) throw new Error("Menu not found.");
  const chef = getChef(menu.chefId);
  if (!chef) throw new Error("Chef not found.");

  const guests = Math.max(menu.minGuests, Math.min(menu.maxGuests, input.guestCount));
  const q = computeQuote(menu.pricePerGuest, guests, chef.travelFee);

  const booking: Booking = {
    id: uid("bk"),
    clientId,
    chefId: chef.id,
    menuId: menu.id,
    status: "requested",
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    guestCount: guests,
    address: {
      street: input.street,
      unit: input.unit || undefined,
      city: input.city || chef.serviceCity,
      kitchenNotes: input.kitchenNotes || undefined,
    },
    allergies: input.allergies.trim() || "No allergies reported.",
    dietaryNotes: input.dietaryNotes,
    specialRequests: input.specialRequests,
    menuSubtotal: q.menuSubtotal,
    travelFee: q.travelFee,
    subtotal: q.subtotal,
    serviceFee: q.serviceFee,
    tax: q.tax,
    totalCharged: q.totalCharged,
    commission: q.commission,
    chefPayout: q.chefPayout,
    items: q.items,
    escrow: "authorized", // card authorized, funds held (Stripe authorize→capture)
    createdAt: new Date().toISOString(),
  };

  addBooking(booking);
  revalidatePath("/bookings");
  revalidatePath("/chef");
  redirect(`/bookings/${booking.id}?new=1`);
}

// ---- Chef: lifecycle transitions ------------------------------------------

async function assertChefOwns(bookingId: string) {
  const persona = await getPersona();
  if (persona !== "chef") throw new Error("Chef only.");
  const booking = getBooking(bookingId);
  if (!booking || booking.chefId !== PERSONA_CHEF_ID) {
    throw new Error("Not your booking.");
  }
  return booking;
}

export async function chefAccept(bookingId: string): Promise<void> {
  await assertChefOwns(bookingId);
  // accept = confirm + capture the held authorization
  updateBooking(bookingId, { status: "confirmed", escrow: "held" });
  revalidateBooking(bookingId);
}

export async function chefDecline(bookingId: string): Promise<void> {
  await assertChefOwns(bookingId);
  updateBooking(bookingId, { status: "declined", escrow: "refunded" });
  revalidateBooking(bookingId);
}

export async function chefStart(bookingId: string): Promise<void> {
  await assertChefOwns(bookingId);
  updateBooking(bookingId, { status: "in_progress" });
  revalidateBooking(bookingId);
}

export async function chefComplete(bookingId: string): Promise<void> {
  await assertChefOwns(bookingId);
  // service complete → release escrow to the chef (transfer net payout, doc 03)
  updateBooking(bookingId, { status: "completed", escrow: "released" });
  revalidateBooking(bookingId);
}

// ---- Client: cancel --------------------------------------------------------

export async function clientCancel(bookingId: string): Promise<void> {
  const persona = await getPersona();
  const clientId = currentUserId(persona);
  const booking = getBooking(bookingId);
  if (!booking || booking.clientId !== clientId) throw new Error("Not your booking.");
  updateBooking(bookingId, { status: "cancelled_client", escrow: "refunded" });
  revalidateBooking(bookingId);
}

// ---- Messaging -------------------------------------------------------------

export async function sendMessage(bookingId: string, formData: FormData): Promise<void> {
  const persona = await getPersona();
  const senderId = currentUserId(persona);
  if (!senderId) throw new Error("Sign in to message.");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  addMessage({
    id: uid("msg"),
    bookingId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  });
  revalidateBooking(bookingId);
}

// ---- Reviews (double-blind) -----------------------------------------------

export async function submitReview(bookingId: string, formData: FormData): Promise<void> {
  const persona = await getPersona();
  const authorId = currentUserId(persona);
  if (!authorId) throw new Error("Sign in to review.");
  const direction = persona === "chef" ? "chef_to_client" : "client_to_chef";

  const num = (k: string) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };

  addReview({
    id: uid("rev"),
    bookingId,
    authorId,
    direction,
    ratingFood: direction === "client_to_chef" ? num("ratingFood") : undefined,
    ratingPresentation: direction === "client_to_chef" ? num("ratingPresentation") : undefined,
    ratingProfessionalism: direction === "client_to_chef" ? num("ratingProfessionalism") : undefined,
    ratingCommunication: num("ratingCommunication"),
    comment: String(formData.get("comment") ?? "").trim(),
    isVisible: false, // held until both sides submit (store flips it)
    createdAt: new Date().toISOString(),
  });
  revalidateBooking(bookingId);
}

// ---- Chef application (landing funnel) ------------------------------------

export async function submitApplication(formData: FormData): Promise<void> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  addApplication({
    id: uid("app"),
    name: get("name"),
    city: get("city"),
    email: get("email"),
    phone: get("phone"),
    yearsCooking: get("yearsCooking"),
    cuisines: get("cuisines"),
    links: get("links"),
    hasFoodSafetyCert: get("hasFoodSafetyCert") || "no",
    hasInsurance: get("hasInsurance") || "no",
    workTypes: formData.getAll("workTypes").map(String),
    about: get("about"),
    status: "submitted",
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/admin");
  redirect("/apply?submitted=1");
}

export async function joinWaitlist(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!email) return;
  addWaitlist({ id: uid("wl"), email, city: city || "Unknown", createdAt: new Date().toISOString() });
  revalidatePath("/");
}

// ---- Admin -----------------------------------------------------------------

export async function adminApproveChef(chefId: string, appId?: string): Promise<void> {
  const persona = await getPersona();
  if (persona !== "admin") throw new Error("Admin only.");
  approveChefStore(chefId);
  if (appId) approveApplication(appId);
  revalidatePath("/admin");
  revalidatePath("/discover");
}

export async function adminApproveApplicationOnly(appId: string): Promise<void> {
  const persona = await getPersona();
  if (persona !== "admin") throw new Error("Admin only.");
  approveApplication(appId);
  revalidatePath("/admin");
}

export async function adminRefund(bookingId: string): Promise<void> {
  const persona = await getPersona();
  if (persona !== "admin") throw new Error("Admin only.");
  updateBooking(bookingId, { status: "refunded", escrow: "refunded" });
  revalidatePath("/admin");
  revalidateBooking(bookingId);
}

// ---- Demo reset ------------------------------------------------------------

export async function resetDemo(): Promise<void> {
  resetStore();
  revalidatePath("/", "layout");
  redirect("/discover");
}

function revalidateBooking(bookingId: string) {
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/chef");
  revalidatePath("/chef/requests");
  revalidatePath("/chef/earnings");
  revalidatePath("/admin");
}
