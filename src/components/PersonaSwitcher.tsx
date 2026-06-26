"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchPersona } from "@/lib/actions";
import type { Persona } from "@/lib/types";

const OPTIONS: { value: Persona; label: string; sub: string }[] = [
  { value: "client", label: "Jordan Lee", sub: "Client" },
  { value: "chef", label: "Ana Reyes", sub: "Chef" },
  { value: "admin", label: "Admin", sub: "Hearth ops" },
];

export function PersonaSwitcher({ persona }: { persona: Persona }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const current = OPTIONS.find((o) => o.value === persona)!;

  function choose(value: Persona) {
    setOpen(false);
    if (value === persona) return;
    start(async () => {
      await switchPersona(value);
      router.push(value === "chef" ? "/chef" : value === "admin" ? "/admin" : "/discover");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium hover:bg-sand"
        disabled={pending}
      >
        <span className="hidden sm:inline text-muted">Viewing as</span>
        <span className="font-semibold">{current.sub}</span>
        <span className="text-muted">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-paper shadow-lg">
            <div className="border-b border-line px-3 py-2 text-xs text-muted">
              Demo personas (no real auth)
            </div>
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-sand ${
                  o.value === persona ? "bg-sand" : ""
                }`}
              >
                <span>
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-xs text-muted">{o.sub}</span>
                </span>
                {o.value === persona && <span className="text-terracotta">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
