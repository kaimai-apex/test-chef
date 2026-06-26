"use client";

import { useTransition } from "react";
import {
  chefAccept,
  chefComplete,
  chefDecline,
  chefStart,
  clientCancel,
} from "@/lib/actions";
import type { BookingStatus, Persona } from "@/lib/types";

export function BookingActions({
  bookingId,
  status,
  persona,
}: {
  bookingId: string;
  status: BookingStatus;
  persona: Persona;
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => () => start(() => fn());

  if (persona === "chef") {
    if (status === "requested") {
      return (
        <div className="flex gap-2">
          <button className="btn-primary" disabled={pending} onClick={run(() => chefAccept(bookingId))}>
            Accept &amp; confirm
          </button>
          <button className="btn-outline" disabled={pending} onClick={run(() => chefDecline(bookingId))}>
            Decline
          </button>
        </div>
      );
    }
    if (status === "confirmed") {
      return (
        <button className="btn-primary" disabled={pending} onClick={run(() => chefStart(bookingId))}>
          Mark in progress
        </button>
      );
    }
    if (status === "in_progress") {
      return (
        <button className="btn-primary" disabled={pending} onClick={run(() => chefComplete(bookingId))}>
          Mark completed &amp; release payout
        </button>
      );
    }
  }

  if (persona === "client" && (status === "requested" || status === "confirmed")) {
    return (
      <button className="btn-outline" disabled={pending} onClick={run(() => clientCancel(bookingId))}>
        Cancel booking
      </button>
    );
  }

  return null;
}
