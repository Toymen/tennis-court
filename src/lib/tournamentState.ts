import { buildDefaultCourtNames } from "@/lib/utils";
import type { Gender, Player, Round } from "@/types";

export interface TournamentFormState {
  players: Player[];
  rounds: Round[];
  playerInput: string;
  newPlayer: string;
  newGender: Gender;
  newStrength: number;
  roundCount: number;
  courtCount: number;
  courtNames: string[];
  startTime: string;
  matchDuration: number;
  breakDuration: number;
}

const DEFAULT_COURTS = 2;

export function createDefaultTournamentState(): TournamentFormState {
  return {
    players: [],
    rounds: [],
    playerInput: "",
    newPlayer: "",
    newGender: "m",
    newStrength: 3,
    roundCount: 5,
    courtCount: DEFAULT_COURTS,
    courtNames: buildDefaultCourtNames(DEFAULT_COURTS),
    startTime: "18:00",
    matchDuration: 35,
    breakDuration: 10,
  };
}

export function normalizeTournamentState(state?: Partial<TournamentFormState> | null): TournamentFormState {
  const fallback = createDefaultTournamentState();
  const parsed = state ?? {};

  return {
    players: Array.isArray(parsed.players) ? parsed.players : fallback.players,
    rounds: Array.isArray(parsed.rounds) ? parsed.rounds : fallback.rounds,
    playerInput: typeof parsed.playerInput === "string" ? parsed.playerInput : fallback.playerInput,
    newPlayer: typeof parsed.newPlayer === "string" ? parsed.newPlayer : fallback.newPlayer,
    newGender:
      parsed.newGender === "m" || parsed.newGender === "w" || parsed.newGender === "o"
        ? parsed.newGender
        : fallback.newGender,
    newStrength: typeof parsed.newStrength === "number" ? parsed.newStrength : fallback.newStrength,
    roundCount: typeof parsed.roundCount === "number" ? parsed.roundCount : fallback.roundCount,
    courtCount: typeof parsed.courtCount === "number" ? parsed.courtCount : fallback.courtCount,
    courtNames: Array.isArray(parsed.courtNames) ? parsed.courtNames : fallback.courtNames,
    startTime: typeof parsed.startTime === "string" ? parsed.startTime : fallback.startTime,
    matchDuration: typeof parsed.matchDuration === "number" ? parsed.matchDuration : fallback.matchDuration,
    breakDuration: typeof parsed.breakDuration === "number" ? parsed.breakDuration : fallback.breakDuration,
  };
}
