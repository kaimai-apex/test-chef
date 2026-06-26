// Domain types — mirror the Postgres schema in db/schema.sql (doc 06-data-model).
// The web app runs against a local file-backed store (src/lib/store.ts) that
// implements the same shapes, so swapping in Supabase later is a thin adapter.

export type ChefStatus = "pending" | "approved" | "suspended";

export type BookingStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled_client"
  | "cancelled_chef"
  | "disputed"
  | "refunded"
  | "expired";

export type EscrowStatus =
  | "authorized"
  | "held"
  | "released"
  | "refunded"
  | "partially_refunded";

export type ReviewDirection = "client_to_chef" | "chef_to_client";

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  isChef: boolean;
  isClient: boolean;
  createdAt: string;
}

export interface Course {
  name: string;
  dishes: string[];
}

export interface Menu {
  id: string;
  chefId: string;
  name: string;
  description: string;
  pricePerGuest: number;
  minGuests: number;
  maxGuests: number;
  dietaryTags: string[];
  courses: Course[];
  seed: string; // for the deterministic photo placeholder
  isActive: boolean;
}

export interface ChefProfile {
  id: string;
  userId: string;
  displayName: string;
  tagline: string;
  bio: string;
  cuisines: string[];
  dietarySpecialties: string[];
  serviceCity: string;
  serviceRadiusKm: number;
  neighborhood: string;
  maxPartySize: number;
  travelFee: number; // flat travel fee for the demo
  ratingAvg: number;
  ratingCount: number;
  bookingsCompleted: number;
  status: ChefStatus;
  foodSafetyCertVerified: boolean;
  insuranceVerified: boolean;
  idVerified: boolean;
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
  // availability (recurring weekly + ad-hoc blocks); concrete dates computed at runtime
  availabilityWeekdays: number[]; // 0=Sun .. 6=Sat
  leadTimeDays: number;
  blockedDates: string[]; // ISO yyyy-mm-dd
  seed: string;
}

export interface BookingItem {
  label: string;
  amount: number;
  type: "menu" | "travel" | "fee" | "tax";
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  kitchenNotes?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  chefId: string;
  menuId: string | null;
  status: BookingStatus;
  eventDate: string; // ISO yyyy-mm-dd
  eventTime: string; // "18:30"
  guestCount: number;
  address: Address;
  allergies: string;
  dietaryNotes: string;
  specialRequests: string;
  // money snapshot (denormalized at creation — never rewritten by later menu edits)
  menuSubtotal: number;
  travelFee: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  totalCharged: number;
  commission: number;
  chefPayout: number;
  items: BookingItem[];
  escrow: EscrowStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  direction: ReviewDirection;
  ratingFood?: number;
  ratingPresentation?: number;
  ratingProfessionalism?: number;
  ratingCommunication?: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
}

export interface ChefApplication {
  id: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  yearsCooking: string;
  cuisines: string;
  links: string;
  hasFoodSafetyCert: string;
  hasInsurance: string;
  workTypes: string[];
  about: string;
  status: "submitted" | "approved" | "rejected";
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  city: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  chefs: ChefProfile[];
  menus: Menu[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  applications: ChefApplication[];
  waitlist: WaitlistEntry[];
}

export type Persona = "client" | "chef" | "admin";
