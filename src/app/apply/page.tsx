import Link from "next/link";
import { submitApplication } from "@/lib/actions";
import { COMMISSION_RATE } from "@/lib/pricing";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  if (submitted) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <div className="text-5xl">👏</div>
        <h1 className="mt-4 text-3xl font-bold">Application received</h1>
        <p className="mt-3 text-muted">
          Thanks for applying to cook with Hearth. Our team reviews every chef by
          hand — we&apos;ll verify your certification and insurance, then reach out
          to set up a personal onboarding session to build your menus, shoot photos,
          and set your calendar.
        </p>
        <p className="mt-2 text-sm text-muted">
          (In this demo, your application now appears in the Admin console queue —
          switch to the Admin persona to review and approve it.)
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-outline">Back home</Link>
          <Link href="/discover" className="btn-primary">Browse the marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="mb-8">
        <span className="chip mb-3">For chefs</span>
        <h1 className="text-3xl font-bold sm:text-4xl">Apply to cook</h1>
        <p className="mt-3 text-muted">
          Keep more of what you earn — just {Math.round(COMMISSION_RATE * 100)}% commission,
          fast weekly payouts, and real local leads. Tell us a little about you; accepted
          chefs get a personal onboarding session.
        </p>
      </div>

      <form action={submitApplication} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" required />
          <Field label="City" name="city" defaultValue="Austin" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Phone" name="phone" type="tel" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years cooking professionally" name="yearsCooking" type="number" />
          <Field label="Instagram / portfolio links" name="links" placeholder="instagram.com/…" />
        </div>

        <Field
          label="Cuisines & specialties"
          name="cuisines"
          placeholder="e.g. Coastal Italian, Mediterranean, seafood"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Do you hold a current food-safety certification?"
            name="hasFoodSafetyCert"
            options={[
              ["yes", "Yes, current"],
              ["working_on_it", "Working on it"],
              ["no", "Not yet"],
            ]}
          />
          <Select
            label="Do you carry general liability insurance?"
            name="hasInsurance"
            options={[
              ["yes", "Yes"],
              ["need_help", "Need help getting it"],
              ["no", "No"],
            ]}
          />
        </div>

        <fieldset>
          <legend className="label">What kind of work do you want?</legend>
          <div className="flex flex-wrap gap-4">
            {[
              ["dinners", "Dinner parties"],
              ["meal_prep", "Weekly meal prep"],
              ["events", "Special events"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="workTypes" value={value} className="h-4 w-4 accent-[var(--color-terracotta)]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="about">A little about your cooking</label>
          <textarea id="about" name="about" rows={4} className="input" placeholder="Where you've cooked, what makes your food special, the kind of dinners you love to run." />
        </div>

        <p className="text-xs text-muted">
          Photos of your food are requested after acceptance, during your onboarding
          session. We keep the application short on purpose.
        </p>

        <button type="submit" className="btn-primary w-full sm:w-auto">Submit application</button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-terracotta">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} className="input">
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </div>
  );
}
