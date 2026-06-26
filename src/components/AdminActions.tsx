"use client";

import { useTransition } from "react";
import { adminApproveChef, adminApproveApplicationOnly, adminRefund } from "@/lib/actions";

export function ApproveChefButton({ chefId, appId }: { chefId: string; appId?: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-primary" disabled={pending} onClick={() => start(() => adminApproveChef(chefId, appId))}>
      {pending ? "Approving…" : "Verify & approve"}
    </button>
  );
}

export function ApproveApplicationButton({ appId }: { appId: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-outline" disabled={pending} onClick={() => start(() => adminApproveApplicationOnly(appId))}>
      {pending ? "…" : "Mark approved"}
    </button>
  );
}

export function RefundButton({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="text-xs font-semibold text-danger hover:underline disabled:opacity-50" disabled={pending} onClick={() => start(() => adminRefund(bookingId))}>
      {pending ? "…" : "Refund"}
    </button>
  );
}
