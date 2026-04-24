import type { Match, Player, Round, TournamentHistory } from "@/types";
import { addMinutesToTime } from "@/lib/utils";

function byStrengthDesc(a: Player, b: Player): number {
  return Number(b.strength ?? 0) - Number(a.strength ?? 0);
}

function teamStrength(team: Player[]): number {
  return team.reduce((total, player) => total + Number(player.strength ?? 0), 0);
}

function pairPlayers(pool: Player[]): Player[][] {
  const ordered = [...pool].sort(byStrengthDesc);
  const teams: Player[][] = [];

  while (ordered.length >= 2) {
    const strongest = ordered.shift();
    const weakest = ordered.pop();

    if (!strongest || !weakest) break;
    teams.push([strongest, weakest]);
  }

  return teams;
}

function createTeams(players: Player[]): Player[][] {
  const men = players.filter((player) => player.gender === "m").sort(byStrengthDesc);
  const women = players.filter((player) => player.gender === "w").sort(byStrengthDesc);
  const flexible = players.filter((player) => player.gender !== "m" && player.gender !== "w");
  const teams: Player[][] = [];

  while (men.length > 0 && women.length > 0) {
    const man = men.shift();
    const woman = women.pop();

    if (!man || !woman) break;
    teams.push([man, woman]);
  }

  return [...teams, ...pairPlayers([...men, ...women, ...flexible])];
}

function createRound(
  players: Player[],
  roundNumber: number,
  courtNames: string[],
  history: TournamentHistory,
): { matches: Match[]; benched: Player[] } {
  const ordered = [...players].sort((a, b) => {
    const pauseDelta = (history.pause[b.id] ?? 0) - (history.pause[a.id] ?? 0);
    if (pauseDelta !== 0) return pauseDelta;
    const playedDelta = (history.played[a.id] ?? 0) - (history.played[b.id] ?? 0);
    if (playedDelta !== 0) return playedDelta;
    return Number(b.strength ?? 0) - Number(a.strength ?? 0);
  });

  const matchCount = Math.min(Math.floor(ordered.length / 4), courtNames.length);
  const activePlayers = ordered.slice(0, matchCount * 4);
  const benched = ordered.slice(matchCount * 4);
  const teams = createTeams(activePlayers).sort((teamA, teamB) => teamStrength(teamB) - teamStrength(teamA));
  const matches: Match[] = [];

  for (let i = 0; i < matchCount; i += 1) {
    const teamA = teams[i];
    const teamB = teams[teams.length - 1 - i];

    if (!teamA || !teamB) continue;

    for (const p of [...teamA, ...teamB]) {
      history.played[p.id] = (history.played[p.id] ?? 0) + 1;
    }

    matches.push({
      id: `r${roundNumber}-m${i + 1}-${[...teamA, ...teamB].map((p) => p.id).join("-")}`,
      courtName: courtNames[i] ?? `Court ${i + 1}`,
      teamA,
      teamB,
      result: "",
      notes: "",
    });
  }

  for (const p of benched) {
    history.pause[p.id] = (history.pause[p.id] ?? 0) + 1;
  }

  return { matches, benched };
}

export function createSchedule(
  players: Player[],
  roundCount: number,
  courtNames: string[],
  startTime: string,
  matchDuration: number,
  breakDuration: number,
): Round[] {
  const history: TournamentHistory = { played: {}, pause: {} };
  const rounds: Round[] = [];
  const safeCount = Number(roundCount) || 0;
  const blockMinutes = Number(matchDuration) + Number(breakDuration);

  for (let i = 0; i < safeCount; i += 1) {
    const roundNumber = i + 1;
    const round = createRound(players, roundNumber, courtNames, history);
    const roundStart = addMinutesToTime(startTime, i * blockMinutes);
    const roundEnd = addMinutesToTime(roundStart, Number(matchDuration));

    rounds.push({
      id: `runde-${roundNumber}`,
      roundNumber,
      startTime: roundStart,
      endTime: roundEnd,
      breakUntil: i < safeCount - 1 ? addMinutesToTime(roundEnd, Number(breakDuration)) : null,
      matches: round.matches,
      benched: round.benched,
    });
  }

  return rounds;
}
