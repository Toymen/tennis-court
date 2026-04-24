export type Gender = "m" | "w" | "o";

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  strength: number;
}

export interface Match {
  id: string;
  courtName: string;
  teamA: Player[];
  teamB: Player[];
  result: string;
  notes: string;
}

export interface Round {
  id: string;
  roundNumber: number;
  startTime: string;
  endTime: string;
  breakUntil: string | null;
  matches: Match[];
  benched: Player[];
}

export interface PlayerStats extends Player {
  playedRounds: number;
  pauseRounds: number;
  wins: number;
  losses: number;
  draws: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface TournamentHistory {
  played: Record<string, number>;
  pause: Record<string, number>;
}

export interface ParsedResult {
  setsA: number;
  setsB: number;
  gamesA: number;
  gamesB: number;
  winner: "A" | "B" | "draw";
}
