import { useCallback, useMemo, useState } from "react";
import type { Player } from "@/types";
import { safeRandomId, buildDefaultCourtNames, addMinutesToTime } from "@/lib/utils";
import { createSchedule } from "@/lib/tournament";
import { computeLeaderboard } from "@/lib/leaderboard";
import { createDefaultTournamentState, normalizeTournamentState, type TournamentFormState } from "@/lib/tournamentState";

const DEFAULT_STATE = createDefaultTournamentState();
const DEFAULT_COURTS = DEFAULT_STATE.courtCount;

const DEMO_NAMES = [
  "Alexander", "Sophie", "Jonas", "Laura", "Ben", "Marie", "Lukas", "Anna",
  "Tim", "Julia", "Felix", "Leonie", "Paul", "Mia", "Noah", "Emma", "David", "Nina", "Finn", "Clara",
];

export function useTournament(initialState?: TournamentFormState) {
  const initial = normalizeTournamentState(initialState ?? DEFAULT_STATE);

  const [players, setPlayers] = useState(initial.players);
  const [rounds, setRounds] = useState(initial.rounds);
  const [playerInput, setPlayerInput] = useState(initial.playerInput);
  const [newPlayer, setNewPlayer] = useState(initial.newPlayer);
  const [newGender, setNewGender] = useState<Player["gender"]>(initial.newGender);
  const [newStrength, setNewStrength] = useState(initial.newStrength);
  const [roundCount, setRoundCount] = useState(initial.roundCount);
  const [courtCount, setCourtCount] = useState(initial.courtCount);
  const [courtNames, setCourtNames] = useState(initial.courtNames);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [matchDuration, setMatchDuration] = useState(initial.matchDuration);
  const [breakDuration, setBreakDuration] = useState(initial.breakDuration);

  const state = useMemo<TournamentFormState>(() => ({
    players,
    rounds,
    playerInput,
    newPlayer,
    newGender,
    newStrength,
    roundCount,
    courtCount,
    courtNames,
    startTime,
    matchDuration,
    breakDuration,
  }), [players, rounds, playerInput, newPlayer, newGender, newStrength, roundCount, courtCount, courtNames, startTime, matchDuration, breakDuration]);

  const leaderboard = useMemo(() => computeLeaderboard(players, rounds), [players, rounds]);
  const winner = leaderboard.find((entry) => entry.points > 0) ?? null;

  const totalEventEnd = useMemo(() => {
    const total = Number(roundCount) * Number(matchDuration) + Math.max(0, Number(roundCount) - 1) * Number(breakDuration);
    return addMinutesToTime(startTime, total);
  }, [roundCount, matchDuration, breakDuration, startTime]);

  const playerStats = useMemo(() => {
    const men = players.filter((player) => player.gender === "m").length;
    const women = players.filter((player) => player.gender === "w").length;
    const matchesPerRound = Math.min(Math.floor(players.length / 4), Number(courtCount));
    const benchedPerRound = Math.max(0, players.length - matchesPerRound * 4);
    return { men, women, matchesPerRound, benchedPerRound };
  }, [players, courtCount]);

  const replaceState = useCallback((nextState: Partial<TournamentFormState> | null | undefined) => {
    const next = normalizeTournamentState(nextState);
    setPlayers(next.players);
    setRounds(next.rounds);
    setPlayerInput(next.playerInput);
    setNewPlayer(next.newPlayer);
    setNewGender(next.newGender);
    setNewStrength(next.newStrength);
    setRoundCount(next.roundCount);
    setCourtCount(next.courtCount);
    setCourtNames(next.courtNames);
    setStartTime(next.startTime);
    setMatchDuration(next.matchDuration);
    setBreakDuration(next.breakDuration);
  }, []);

  function addSinglePlayer() {
    const name = newPlayer.trim();
    if (!name || players.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
      setNewPlayer("");
      return;
    }

    setPlayers((prev) => [...prev, { id: safeRandomId(), name, gender: newGender, strength: Number(newStrength) }]);
    setNewPlayer("");
    setRounds([]);
  }

  function addBulkPlayers() {
    const names = playerInput.split(/\n|,|;/).map((name) => name.trim()).filter(Boolean);
    const existing = new Set(players.map((player) => player.name.toLowerCase()));
    const imported = names
      .filter((name) => !existing.has(name.toLowerCase()))
      .map((name) => ({ id: safeRandomId(), name, gender: "m" as Player["gender"], strength: 3 }));

    setPlayers((prev) => [...prev, ...imported]);
    setPlayerInput("");
    setRounds([]);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
    setRounds([]);
  }

  function updateCourtCount(value: string) {
    const next = Math.max(1, Math.min(12, Number(value) || 1));
    setCourtCount(next);
    setCourtNames((prev) => {
      const names = [...prev];
      while (names.length < next) names.push(`Court ${names.length + 1}`);
      return names.slice(0, next);
    });
    setRounds([]);
  }

  function updateCourtName(index: number, value: string) {
    setCourtNames((prev) => prev.map((name, currentIndex) => (currentIndex === index ? value : name)));
    setRounds([]);
  }

  function generateDemo() {
    setPlayers(
      DEMO_NAMES.map((name, index) => ({
        id: safeRandomId(),
        name,
        gender: index % 2 === 0 ? "m" : "w",
        strength: (index % 5) + 1,
      })),
    );
    setRounds([]);
  }

  function generateTournament() {
    const safeRounds = Math.max(1, Math.min(12, Number(roundCount) || 5));
    const safeCourts = Math.max(1, Math.min(12, Number(courtCount) || 1));
    const safeMatchDuration = Math.max(10, Math.min(180, Number(matchDuration) || 35));
    const safeBreakDuration = Math.max(0, Math.min(60, Number(breakDuration) || 0));
    const names = courtNames.slice(0, safeCourts).map((name, index) => name.trim() || `Court ${index + 1}`);

    setRoundCount(safeRounds);
    setCourtCount(safeCourts);
    setMatchDuration(safeMatchDuration);
    setBreakDuration(safeBreakDuration);
    setCourtNames(names);
    setRounds(createSchedule(players, safeRounds, names, startTime, safeMatchDuration, safeBreakDuration));
  }

  function resetResults() {
    setRounds((prev) => prev.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({ ...match, result: "", notes: "" })),
    })));
  }

  function clearAll() {
    setPlayers(DEFAULT_STATE.players);
    setRounds(DEFAULT_STATE.rounds);
    setPlayerInput(DEFAULT_STATE.playerInput);
    setNewPlayer(DEFAULT_STATE.newPlayer);
    setNewGender(DEFAULT_STATE.newGender);
    setNewStrength(DEFAULT_STATE.newStrength);
    setRoundCount(DEFAULT_STATE.roundCount);
    setCourtCount(DEFAULT_STATE.courtCount);
    setCourtNames(buildDefaultCourtNames(DEFAULT_COURTS));
    setStartTime(DEFAULT_STATE.startTime);
    setMatchDuration(DEFAULT_STATE.matchDuration);
    setBreakDuration(DEFAULT_STATE.breakDuration);
  }

  function updateMatchField(roundId: string, matchId: string, field: "result" | "notes", value: string) {
    setRounds((prev) => prev.map((round) => (
      round.id !== roundId
        ? round
        : { ...round, matches: round.matches.map((match) => (match.id !== matchId ? match : { ...match, [field]: value })) }
    )));
  }

  return {
    players,
    rounds,
    playerInput,
    newPlayer,
    newGender,
    newStrength,
    roundCount,
    courtCount,
    courtNames,
    startTime,
    matchDuration,
    breakDuration,
    state,
    leaderboard,
    winner,
    totalEventEnd,
    playerStats,
    setPlayerInput,
    setNewPlayer,
    setNewGender,
    setNewStrength,
    setRoundCount,
    setStartTime,
    setMatchDuration,
    setBreakDuration,
    replaceState,
    addSinglePlayer,
    addBulkPlayers,
    removePlayer,
    updateCourtCount,
    updateCourtName,
    generateDemo,
    generateTournament,
    resetResults,
    clearAll,
    updateMatchField,
  };
}
