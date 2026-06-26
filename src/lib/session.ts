// Demo session layer. There is no real auth in this local build — instead we
// let you switch between three personas (a client, a chef, and admin) via a
// cookie, so the two-sided marketplace is fully explorable. In production this
// is replaced by Supabase Auth (Sign in with Apple / Google / phone), per doc 05.
import { cookies } from "next/headers";
import type { Persona } from "./types";

export const PERSONA_COOKIE = "hearth_persona";

// Which seeded user each persona logs in as.
export const PERSONA_USER: Record<Exclude<Persona, "admin">, string> = {
  client: "user_jordan",
  chef: "user_ana",
};

export const PERSONA_CHEF_ID = "chef_ana"; // the chef persona's profile

export async function getPersona(): Promise<Persona> {
  const store = await cookies();
  const value = store.get(PERSONA_COOKIE)?.value;
  if (value === "chef" || value === "admin" || value === "client") return value;
  return "client";
}

export async function setPersona(persona: Persona): Promise<void> {
  const store = await cookies();
  store.set(PERSONA_COOKIE, persona, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function currentUserId(persona: Persona): string | null {
  if (persona === "admin") return null;
  return PERSONA_USER[persona];
}
