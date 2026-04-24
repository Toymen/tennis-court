import type { Match, Player, Round, TournamentHistory } from "@/types";
import { addMinutesToTime, shuffleArray } from "@/lib/utils";

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
  const activePlayers = shuffleArray(ordered.slice(0, matchCount * 4));
  const benched = ordered.slice(matchCount * 4);
  const matches: Match[] = [];

  for (let i = 0; i < matchCount; i += 1) {
    const group = activePlayers.slice(i * 4, i * 4 + 4).sort(
      (a, b) => Number(b.strength ?? 0) - Number(a.strength ?? 0),
    );
    const teamA = [group[0], group[3]];
    const teamB = [group[1], group[2]];

    for (const p of [...teamA, ...teamB]) {
      history.played[p.id] = (history.played[p.id] ?? 0) + 1;
    }

    matches.push({
      id: `r${roundNumber}-m${i + 1}-${group.map((p) => p.id).join("-")}`,
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
