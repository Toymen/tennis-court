import type { Player } from "@/types";

export function sumStrength(players: Player[]): number {
  return players.reduce((sum, p) => sum + Number(p.strength || 0), 0);
}

export function genderLabel(gender: string): string {
  if (gender === "w") return "Weiblich";
  if (gender === "m") return "Männlich";
  return "Offen";
}
