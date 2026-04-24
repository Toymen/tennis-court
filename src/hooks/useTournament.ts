import { useMemo, useState } from "react";
import type { Player, Round } from "@/types";
import { safeRandomId, buildDefaultCourtNames, addMinutesToTime } from "@/lib/utils";
import { createSchedule } from "@/lib/tournament";
import { computeLeaderboard } from "@/lib/leaderboard";

const DEFAULT_COURTS = 2;

const DEMO_NAMES = [
  "Alexander", "Sophie", "Jonas", "Laura", "Ben", "Marie", "Lukas", "Anna",
  "Tim", "Julia", "Felix", "Leonie", "Paul", "Mia", "Noah", "Emma", "David", "Nina", "Finn", "Clara",
];

export function useTournament() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [newGender, setNewGender] = useState("m");
  const [newStrength, setNewStrength] = useState(3);
  const [roundCount, setRoundCount] = useState(5);
  const [courtCount, setCourtCount] = useState(DEFAULT_COURTS);
  const [courtNames, setCourtNames] = useState(buildDefaultCourtNames(DEFAULT_COURTS));
  const [startTime, setStartTime] = useState("18:00");
  const [matchDuration, setMatchDuration] = useState(35);
  const [breakDuration, setBreakDuration] = useState(10);

  const leaderboard = useMemo(() => computeLeaderboard(players, rounds), [players, rounds]);
  const winner = leaderboard.find((e) => e.points > 0) ?? null;

  const totalEventEnd = useMemo(() => {
    const total = Number(roundCount) * Number(matchDuration) + Math.max(0, Number(roundCount) - 1) * Number(breakDuration);
    return addMinutesToTime(startTime, total);
  }, [roundCount, matchDuration, breakDuration, startTime]);

  const playerStats = useMemo(() => {
    const men = players.filter((p) => p.gender === "m").length;
    const women = players.filter((p) => p.gender === "w").length;
    const matchesPerRound = Math.min(Math.floor(players.length / 4), Number(courtCount));
    const benchedPerRound = Math.max(0, players.length - matchesPerRound * 4);
    return { men, women, matchesPerRound, benchedPerRound };
  }, [players, courtCount]);

  function addSinglePlayer() {
    const name = newPlayer.trim();
    if (!name || players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setNewPlayer(""); return;
    }
    setPlayers((prev) => [...prev, { id: safeRandomId(), name, gender: newGender as Player["gender"], strength: Number(newStrength) }]);
    setNewPlayer("");
    setRounds([]);
  }

  function addBulkPlayers() {
    const names = playerInput.split(/\n|,|;/).map((n) => n.trim()).filter(Boolean);
    const existing = new Set(players.map((p) => p.name.toLowerCase()));
    const imported = names.filter((n) => !existing.has(n.toLowerCase()))
      .map((name) => ({ id: safeRandomId(), name, gender: "m" as Player["gender"], strength: 3 }));
    setPlayers((prev) => [...prev, ...imported]);
    setPlayerInput("");
    setRounds([]);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setRounds([]);
  }

  function updateCourtCount(value: string) {
    const next = Math.max(1, Math.min(12, Number(value) || 1));
    setCourtCount(next);
    setCourtNames((prev) => {
      const arr = [...prev];
      while (arr.length < next) arr.push(`Court ${arr.length + 1}`);
      return arr.slice(0, next);
    });
    setRounds([]);
  }

  function updateCourtName(index: number, value: string) {
    setCourtNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    setRounds([]);
  }

  function generateDemo() {
    setPlayers(DEMO_NAMES.map((name, i) => ({ id: safeRandomId(), name, gender: i % 2 === 0 ? "m" : "w", strength: (i % 5) + 1 })));
    setRounds([]);
  }

  function generateTournament() {
    const sr = Math.max(1, Math.min(12, Number(roundCount) || 5));
    const sc = Math.max(1, Math.min(12, Number(courtCount) || 1));
    const sm = Math.max(10, Math.min(180, Number(matchDuration) || 35));
    const sb = Math.max(0, Math.min(60, Number(breakDuration) || 0));
    const names = courtNames.slice(0, sc).map((n, i) => n.trim() || `Court ${i + 1}`);
    setRoundCount(sr); setCourtCount(sc); setMatchDuration(sm); setBreakDuration(sb); setCourtNames(names);
    setRounds(createSchedule(players, sr, names, startTime, sm, sb));
  }

  function resetResults() {
    setRounds((prev) => prev.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m, result: "", notes: "" })) })));
  }

  function clearAll() {
    setPlayers([]); setRounds([]); setPlayerInput(""); setNewPlayer(""); setNewGender("m");
    setNewStrength(3); setRoundCount(5); setCourtCount(DEFAULT_COURTS);
    setCourtNames(buildDefaultCourtNames(DEFAULT_COURTS)); setStartTime("18:00");
    setMatchDuration(35); setBreakDuration(10);
  }

  function updateMatchField(roundId: string, matchId: string, field: "result" | "notes", value: string) {
    setRounds((prev) => prev.map((r) =>
      r.id !== roundId ? r : { ...r, matches: r.matches.map((m) => m.id !== matchId ? m : { ...m, [field]: value }) }
    ));
  }

  return {
    players, rounds, playerInput, newPlayer, newGender, newStrength,
    roundCount, courtCount, courtNames, startTime, matchDuration, breakDuration,
    leaderboard, winner, totalEventEnd, playerStats,
    setPlayerInput, setNewPlayer, setNewGender, setNewStrength, setRoundCount,
    setStartTime, setMatchDuration, setBreakDuration,
    addSinglePlayer, addBulkPlayers, removePlayer,
    updateCourtCount, updateCourtName, generateDemo, generateTournament,
    resetResults, clearAll, updateMatchField,
  };
}
