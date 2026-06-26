"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions";

const CLIENT_AXES: [string, string][] = [
  ["ratingFood", "Food"],
  ["ratingPresentation", "Presentation"],
  ["ratingProfessionalism", "Professionalism"],
  ["ratingCommunication", "Communication"],
];

export function ReviewForm({
  bookingId,
  asChef,
}: {
  bookingId: string;
  asChef: boolean;
}) {
  const axes = asChef ? ([["ratingCommunication", "Communication"]] as [string, string][]) : CLIENT_AXES;
  const [ratings, setRatings] = useState<Record<string, number>>({});

  return (
    <form action={(fd) => submitReview(bookingId, fd)} className="card p-5">
      <h3 className="font-bold">{asChef ? "Review your client" : "Leave a review"}</h3>
      <p className="mt-1 text-sm text-muted">
        Reviews are double-blind — held until both sides submit (or a timer expires),
        so they stay honest.
      </p>
      <div className="mt-4 space-y-3">
        {axes.map(([name, label]) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <StarInput value={ratings[name] ?? 0} onChange={(v) => setRatings((r) => ({ ...r, [name]: v }))} />
            <input type="hidden" name={name} value={ratings[name] ?? 0} />
          </div>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        required
        placeholder={asChef ? "How were they as hosts?" : "How was the meal and the experience?"}
        className="input mt-4"
      />
      <button type="submit" className="btn-primary mt-4">Submit review</button>
    </form>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`px-0.5 text-xl ${n <= (hover || value) ? "text-gold" : "text-line"}`}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
