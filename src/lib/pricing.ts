// Pricing engine — the single source of truth for the marketplace take rate.
// Numbers come straight from doc 03-business-model.md (the ⚠ DECIDE levers).
import type { BookingItem } from "./types";

export const COMMISSION_RATE = 0.15; // chef commission, deducted from payout
export const SERVICE_FEE_RATE = 0.08; // client service fee, added at checkout
export const SAMPLE_TAX_RATE = 0.0825; // illustrative; tax varies by jurisdiction (doc 03)

export const LAUNCH_CITY = "Austin";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface Quote {
  menuSubtotal: number;
  travelFee: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  totalCharged: number;
  commission: number;
  chefPayout: number;
  items: BookingItem[];
}

/**
 * Compute the full price breakdown for a booking.
 * Mirrors the worked example in doc 03: an 8-guest $120/guest dinner with a $40
 * travel fee → $1,000 subtotal, $80 service fee, $150 commission, $850 payout.
 */
export function computeQuote(
  pricePerGuest: number,
  guests: number,
  travelFee: number,
): Quote {
  const menuSubtotal = round2(pricePerGuest * guests);
  const subtotal = round2(menuSubtotal + travelFee);
  const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
  const tax = round2(subtotal * SAMPLE_TAX_RATE);
  const totalCharged = round2(subtotal + serviceFee + tax);
  const commission = round2(subtotal * COMMISSION_RATE);
  const chefPayout = round2(subtotal - commission);

  const items: BookingItem[] = [
    { label: `Menu — ${guests} × $${pricePerGuest}/guest`, amount: menuSubtotal, type: "menu" },
    { label: "Travel fee", amount: travelFee, type: "travel" },
    { label: `Service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`, amount: serviceFee, type: "fee" },
    { label: "Estimated tax", amount: tax, type: "tax" },
  ];

  return {
    menuSubtotal,
    travelFee,
    subtotal,
    serviceFee,
    tax,
    totalCharged,
    commission,
    chefPayout,
    items,
  };
}
