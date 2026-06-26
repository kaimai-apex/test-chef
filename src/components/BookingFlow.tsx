"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ChefProfile, Menu } from "@/lib/types";
import { computeQuote } from "@/lib/pricing";
import { money, shortDate } from "@/lib/format";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { createBooking, type CreateBookingInput } from "@/lib/actions";

const STEPS = ["Date & time", "Guests", "Allergies", "Address", "Review & pay"] as const;
const TIMES = ["12:00", "13:00", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

export function BookingFlow({
  chef,
  menu,
  dates,
}: {
  chef: ChefProfile;
  menu: Menu;
  dates: string[];
}) {
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateBookingInput>({
    menuId: menu.id,
    eventDate: dates[0] ?? "",
    eventTime: "19:00",
    guestCount: menu.minGuests,
    street: "",
    unit: "",
    city: chef.serviceCity,
    kitchenNotes: "",
    allergies: "",
    dietaryNotes: "",
    specialRequests: "",
  });

  const set = <K extends keyof CreateBookingInput>(k: K, v: CreateBookingInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const quote = useMemo(
    () => computeQuote(menu.pricePerGuest, form.guestCount, chef.travelFee),
    [menu.pricePerGuest, form.guestCount, chef.travelFee],
  );

  function next() {
    setError(null);
    if (step === 0 && !form.eventDate) return setError("Pick an available date.");
    if (step === 3 && !form.street.trim()) return setError("We need the address to book.");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createBooking({ ...form, guestCount: Number(form.guestCount) });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {/* Stepper */}
        <ol className="mb-6 flex flex-wrap gap-2 text-xs">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`rounded-full border px-3 py-1 font-medium ${
                i === step
                  ? "border-terracotta bg-terracotta text-white"
                  : i < step
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-line bg-paper text-muted"
              }`}
            >
              {i < step ? "✓ " : ""}
              {label}
            </li>
          ))}
        </ol>

        <div className="card p-6">
          {step === 0 && (
            <Step title="When's the dinner?" hint="Availability is gated by the chef's calendar.">
              <div className="flex flex-wrap gap-2">
                {dates.length === 0 && <p className="text-sm text-muted">No open dates on the near horizon.</p>}
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("eventDate", d)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      form.eventDate === d ? "border-terracotta bg-terracotta/10 font-semibold" : "border-line hover:bg-sand"
                    }`}
                  >
                    {shortDate(d)}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <label className="label">Start time</label>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("eventTime", t)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        form.eventTime === t ? "border-terracotta bg-terracotta/10 font-semibold" : "border-line hover:bg-sand"
                      }`}
                    >
                      {Number(t.split(":")[0]) % 12 || 12}
                      {t.endsWith("30") ? ":30" : ""}
                      {Number(t.split(":")[0]) >= 12 ? "pm" : "am"}
                    </button>
                  ))}
                </div>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="How many guests?" hint={`This menu serves ${menu.minGuests}–${menu.maxGuests}. Price updates live.`}>
              <div className="flex items-center gap-4">
                <Stepper
                  value={form.guestCount}
                  min={menu.minGuests}
                  max={menu.maxGuests}
                  onChange={(v) => set("guestCount", v)}
                />
                <div className="text-sm text-muted">
                  {money(menu.pricePerGuest)} × {form.guestCount} ={" "}
                  <span className="font-semibold text-ink">{money(quote.menuSubtotal)}</span>
                </div>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Allergies & dietary needs"
              hint="This is a safety screen, not an afterthought. Your chef must acknowledge it before service."
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <label className="label text-amber-900">⚠ Allergies (list anything serious)</label>
                <textarea
                  rows={3}
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="e.g. One guest has a severe shellfish allergy."
                  className="input bg-white"
                />
              </div>
              <div className="mt-4">
                <label className="label">Dietary notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.dietaryNotes}
                  onChange={(e) => set("dietaryNotes", e.target.value)}
                  placeholder="Vegetarians, spice level, kids at the table…"
                  className="input"
                />
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step title="Where are we cooking?" hint="Hearth chefs cook in your kitchen and clean up after.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Street address *</label>
                  <input className="input" value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="1204 E 6th St" />
                </div>
                <div>
                  <label className="label">Unit / apt</label>
                  <input className="input" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Kitchen notes</label>
                  <input className="input" value={form.kitchenNotes} onChange={(e) => set("kitchenNotes", e.target.value)} placeholder="Gas range, oven type, counter space, parking…" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Special requests</label>
                  <input className="input" value={form.specialRequests} onChange={(e) => set("specialRequests", e.target.value)} placeholder="Birthday, anniversary, plating preferences…" />
                </div>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="Review & pay" hint="Funds are authorized now and held in escrow — released to the chef after your dinner.">
              <dl className="divide-y divide-line text-sm">
                <Review label="Menu" value={menu.name} />
                <Review label="Chef" value={chef.displayName} />
                <Review label="Date" value={`${shortDate(form.eventDate)} · ${form.eventTime}`} />
                <Review label="Guests" value={String(form.guestCount)} />
                <Review label="Address" value={`${form.street}${form.unit ? `, ${form.unit}` : ""}, ${form.city}`} />
                <Review label="Allergies" value={form.allergies || "None reported"} highlight />
              </dl>

              <div className="mt-5 rounded-xl border border-line bg-sand/50 p-4">
                <div className="mb-3 text-sm font-semibold">💳 Payment (simulated)</div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
                  <span>•••• •••• •••• 4242</span>
                  <span>Apple Pay ready</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  No real charge — this demo simulates a Stripe authorize→capture with escrow.
                </p>
              </div>
            </Step>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={back} className="btn-ghost" disabled={step === 0 || pending}>
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary">Continue →</button>
            ) : (
              <button type="button" onClick={submit} className="btn-primary" disabled={pending}>
                {pending ? "Processing…" : `Pay ${money(quote.totalCharged)} & request booking`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live price rail */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{menu.name}</h3>
            <Link href={`/chefs/${chef.id}`} className="text-xs text-terracotta hover:underline">
              {chef.displayName}
            </Link>
          </div>
          <PriceBreakdown quote={quote} />
          <p className="mt-4 text-xs text-muted">
            All-in price for {form.guestCount} guests. No surprise fees at checkout.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg hover:bg-sand">–</button>
      <span className="w-12 text-center text-2xl font-bold">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg hover:bg-sand">+</button>
    </div>
  );
}

function Review({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? "text-terracotta" : ""}`}>{value}</dd>
    </div>
  );
}
