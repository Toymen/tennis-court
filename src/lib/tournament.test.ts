import { describe, expect, it } from "vitest";
import { createSchedule } from "./tournament";
import type { Gender, Player } from "@/types";

function makePlayer(id: string, gender: Gender, strength: number): Player {
  return {
    id,
    name: `${gender}-${id}`,
    gender,
    strength,
  };
}

function getTeams(players: Player[]) {
  const [round] = createSchedule(players, 1, ["Court 1", "Court 2"], "18:00", 35, 10);
  return round?.matches.flatMap((match) => [match.teamA, match.teamB]) ?? [];
}

function isMixedTeam(team: Player[]) {
  const genders = new Set(team.map((player) => player.gender));
  return genders.has("m") && genders.has("w");
}

describe("createSchedule", () => {
  it("builds mixed teams when enough women and men are available", () => {
    const teams = getTeams([
      makePlayer("1", "m", 5),
      makePlayer("2", "m", 4),
      makePlayer("3", "w", 3),
      makePlayer("4", "w", 2),
    ]);

    expect(teams).toHaveLength(2);
    expect(teams.every(isMixedTeam)).toBe(true);
  });

  it("maximizes mixed teams across multiple courts", () => {
    const teams = getTeams([
      makePlayer("1", "m", 8),
      makePlayer("2", "m", 7),
      makePlayer("3", "m", 6),
      makePlayer("4", "m", 5),
      makePlayer("5", "w", 8),
      makePlayer("6", "w", 7),
      makePlayer("7", "w", 6),
      makePlayer("8", "w", 5),
    ]);

    expect(teams).toHaveLength(4);
    expect(teams.every(isMixedTeam)).toBe(true);
  });

  it("allows a same-gender team only when not enough women or men are available", () => {
    const teams = getTeams([
      makePlayer("1", "m", 6),
      makePlayer("2", "m", 5),
      makePlayer("3", "m", 4),
      makePlayer("4", "w", 3),
    ]);

    expect(teams).toHaveLength(2);
    expect(teams.filter(isMixedTeam)).toHaveLength(1);
  });

  it("uses all available women to create as many mixed teams as possible", () => {
    const teams = getTeams([
      makePlayer("1", "m", 8),
      makePlayer("2", "m", 7),
      makePlayer("3", "m", 6),
      makePlayer("4", "m", 5),
      makePlayer("5", "m", 4),
      makePlayer("6", "m", 3),
      makePlayer("7", "w", 8),
      makePlayer("8", "w", 7),
    ]);

    expect(teams).toHaveLength(4);
    expect(teams.filter(isMixedTeam)).toHaveLength(2);
  });
});
