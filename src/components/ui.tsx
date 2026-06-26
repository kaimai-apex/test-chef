import Link from "next/link";
import type { BookingStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/booking";

export function StatusPill({ status }: { status: BookingStatus }) {
  const tone = STATUS_TONE[status];
  const styles: Record<string, string> = {
    neutral: "bg-sand text-muted border-line",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bad: "bg-red-50 text-red-700 border-red-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-gold" aria-hidden>
        {"★".repeat(full)}
        <span className="text-line">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      ✓ Verified
    </span>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-3xl">🍳</div>
      <div>
        <div className="font-semibold">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      </div>
      {cta && (
        <Link href={cta.href} className="btn-primary mt-2">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
