// Deterministic gradient "photo" placeholder. Food photography is the product
// (doc 04) — in production these are real Supabase-hosted images. Here we derive
// a stable, on-brand gradient from a seed string so the UI looks intentional and
// renders identically every time (no broken external images).

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const FOOD_EMOJI = ["🍽️", "🥘", "🍝", "🥗", "🍤", "🧆", "🍷", "🔥", "🥐", "🍲"];

export function Photo({
  seed,
  label,
  className = "",
  rounded = "rounded-2xl",
}: {
  seed: string;
  label?: string;
  className?: string;
  rounded?: string;
}) {
  const h = hash(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 35 + (h % 40)) % 360;
  const emoji = FOOD_EMOJI[h % FOOD_EMOJI.length];
  const bg = `linear-gradient(135deg, hsl(${hue1} 55% 42%), hsl(${hue2} 60% 30%))`;

  return (
    <div
      className={`relative flex items-end overflow-hidden ${rounded} ${className}`}
      style={{ background: bg }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-3 text-6xl opacity-25 select-none"
      >
        {emoji}
      </span>
      {label && (
        <span className="relative z-10 m-3 rounded-lg bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}

export function Avatar({ seed, name, size = 44 }: { seed: string; name: string; size?: number }) {
  const h = hash(seed);
  const hue = h % 360;
  const bg = `linear-gradient(135deg, hsl(${hue} 50% 45%), hsl(${(hue + 40) % 360} 55% 35%))`;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
