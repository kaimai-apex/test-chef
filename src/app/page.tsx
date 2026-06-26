import Link from "next/link";
import { getApprovedChefs, getMenusForChef } from "@/lib/store";
import { ChefCard } from "@/components/ChefCard";
import { Photo } from "@/components/Photo";
import { joinWaitlist } from "@/lib/actions";
import { COMMISSION_RATE, LAUNCH_CITY } from "@/lib/pricing";

export default function LandingPage() {
  const chefs = getApprovedChefs()
    .slice()
    .sort((a, b) => b.ratingAvg - a.ratingAvg)
    .slice(0, 3);

  return (
    <div>
      {/* Hero — client funnel */}
      <section className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <span className="chip mb-4">Now in {LAUNCH_CITY}</span>
          <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl">
            A private chef in your home — booked in minutes.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Browse vetted local chefs, see real menus and transparent all-in prices,
            and book for your next dinner. We cook, we clean up, you host.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/discover" className="btn-primary">Browse chefs</Link>
            <Link href="/apply" className="btn-outline">I&apos;m a chef →</Link>
          </div>
          <div className="mt-6 flex items-center gap-5 text-sm text-muted">
            <span>✓ Vetted &amp; insured</span>
            <span>✓ Transparent pricing</span>
            <span>✓ Protected payments</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Photo seed="hero-1" className="aspect-[3/4]" label="Coastal Italian" />
          <div className="grid gap-3">
            <Photo seed="hero-2" className="aspect-square" label="Mezze feast" />
            <Photo seed="hero-3" className="aspect-square" label="Sunday supper" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-paper">
        <div className="container-page py-14">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", t: "Browse chefs", d: "Filter by your date, party size, cuisine and budget. Every chef is vetted, certified and insured." },
              { n: "2", t: "Pick your menu & date", d: "See full courses and an all-in price — no surprise fees. Pay securely; funds are held in escrow until after your dinner." },
              { n: "3", t: "Enjoy", d: "Your chef shops, cooks in your kitchen, and cleans up. You just host. Leave a review afterward." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-terracotta text-lg font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured chefs */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Meet a few of our chefs</h2>
          <Link href="/discover" className="text-sm font-semibold text-terracotta hover:underline">
            See all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chefs.map((chef) => {
            const menus = getMenusForChef(chef.id).filter((m) => m.isActive);
            const fromPrice = Math.min(...menus.map((m) => m.pricePerGuest));
            return (
              <ChefCard
                key={chef.id}
                chef={chef}
                fromPrice={fromPrice}
                signatureMenu={menus[0]?.name}
              />
            );
          })}
        </div>
      </section>

      {/* Chef recruiting funnel */}
      <section className="bg-ink text-cream">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Built by a chef, for chefs
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Earn doing what you love. We handle the rest.
            </h2>
            <p className="mt-4 max-w-md text-white/70">
              Get booked by local clients, get paid fast, and run your whole
              private-chef business from one app.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                `Lower commission than the big platforms — just ${Math.round(COMMISSION_RATE * 100)}% (they charge 20%).`,
                "Fast, reliable weekly payouts — itemized, via Stripe.",
                "Real leads, not cold marketing. Clients come to you.",
                "Menus, calendar, client chat, reviews & earnings in one place.",
                "You set your menus and prices. You're the chef; we're the rails.",
              ].map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="text-terracotta">●</span>
                  <span className="text-white/85">{b}</span>
                </li>
              ))}
            </ul>
            <Link href="/apply" className="btn-primary mt-8">Apply to cook</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Photo seed="chef-life-1" className="aspect-square" />
            <Photo seed="chef-life-2" className="aspect-square" />
            <Photo seed="chef-life-3" className="aspect-square" />
            <Photo seed="chef-life-4" className="aspect-square" />
          </div>
        </div>
      </section>

      {/* Client waitlist (other cities) */}
      <section className="container-page py-16">
        <div className="card mx-auto max-w-2xl p-8 text-center">
          <h2 className="text-2xl font-bold">Not in {LAUNCH_CITY}?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            We&apos;re opening one city at a time. Tell us where you are and we&apos;ll
            let you know the moment Hearth comes to you.
          </p>
          <form action={joinWaitlist} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
            <input name="email" type="email" required placeholder="you@email.com" className="input" />
            <input name="city" placeholder="Your city" className="input sm:max-w-[40%]" />
            <button type="submit" className="btn-dark whitespace-nowrap">Join waitlist</button>
          </form>
        </div>
      </section>
    </div>
  );
}
