import { money } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

// Client-facing breakdown — always all-in, no surprise fees (doc 02 UX rule).
export function PriceBreakdown({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-2 text-sm">
      {quote.items.map((item) => (
        <Row key={item.label} label={item.label} amount={item.amount} />
      ))}
      <div className="my-1 border-t border-line" />
      <div className="flex items-center justify-between font-bold">
        <span>Total</span>
        <span>{money(quote.totalCharged)}</span>
      </div>
    </div>
  );
}

// Chef-facing payout breakdown — gross, commission, net (doc 03 earnings view).
export function PayoutBreakdown({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="Booking subtotal" amount={quote.subtotal} />
      <Row label="Hearth commission (15%)" amount={-quote.commission} negative />
      <div className="my-1 border-t border-line" />
      <div className="flex items-center justify-between font-bold">
        <span>Your payout</span>
        <span className="text-success">{money(quote.chefPayout)}</span>
      </div>
    </div>
  );
}

function Row({ label, amount, negative }: { label: string; amount: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={negative ? "text-muted" : ""}>
        {negative ? `– ${money(Math.abs(amount))}` : money(amount)}
      </span>
    </div>
  );
}
