import type { ParsedResult } from "@/types";

export function parseResultInput(value: string): ParsedResult | null {
  const matches = String(value || "").match(/(\d+)\s*[:-]\s*(\d+)/g);
  if (!matches) return null;

  let setsA = 0;
  let setsB = 0;
  let gamesA = 0;
  let gamesB = 0;

  for (const setText of matches) {
    const [a, b] = setText.split(/[:-]/).map((p) => Number(p.trim()) || 0);
    gamesA += a;
    gamesB += b;
    if (a > b) setsA += 1;
    if (b > a) setsB += 1;
  }

  return {
    setsA,
    setsB,
    gamesA,
    gamesB,
    winner: setsA > setsB ? "A" : setsB > setsA ? "B" : "draw",
  };
}
