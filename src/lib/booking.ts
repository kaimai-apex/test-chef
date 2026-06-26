// Booking state machine + labels (doc 02 "Booking states").
import type { BookingStatus } from "./types";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  declined: "Declined",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled_client: "Cancelled",
  cancelled_chef: "Cancelled by chef",
  disputed: "Disputed",
  refunded: "Refunded",
  expired: "Expired",
};

// tone drives the StatusPill color
export const STATUS_TONE: Record<BookingStatus, "neutral" | "warn" | "good" | "bad" | "info"> = {
  requested: "warn",
  accepted: "info",
  declined: "bad",
  confirmed: "good",
  in_progress: "info",
  completed: "good",
  cancelled_client: "bad",
  cancelled_chef: "bad",
  disputed: "bad",
  refunded: "neutral",
  expired: "neutral",
};

export function isUpcoming(status: BookingStatus): boolean {
  return ["requested", "accepted", "confirmed", "in_progress"].includes(status);
}

export function isPast(status: BookingStatus): boolean {
  return ["completed", "declined", "cancelled_client", "cancelled_chef", "refunded", "expired"].includes(
    status,
  );
}
