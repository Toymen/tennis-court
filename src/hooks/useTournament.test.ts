import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTournament } from "./useTournament";

describe("useTournament", () => {
  it("loads a provided tournament state", () => {
    const { result } = renderHook(() => useTournament({
      players: [{ id: "p1", name: "Alex", gender: "m", strength: 4 }],
      rounds: [],
      playerInput: "bulk",
      newPlayer: "Chris",
      newGender: "w",
      newStrength: 2,
      roundCount: 7,
      courtCount: 3,
      courtNames: ["Center Court", "Court 2", "Court 3"],
      startTime: "19:30",
      matchDuration: 40,
      breakDuration: 15,
    }));

    expect(result.current.players).toEqual([{ id: "p1", name: "Alex", gender: "m", strength: 4 }]);
    expect(result.current.playerInput).toBe("bulk");
    expect(result.current.newPlayer).toBe("Chris");
    expect(result.current.newGender).toBe("w");
    expect(result.current.newStrength).toBe(2);
    expect(result.current.roundCount).toBe(7);
    expect(result.current.courtCount).toBe(3);
    expect(result.current.courtNames).toEqual(["Center Court", "Court 2", "Court 3"]);
    expect(result.current.startTime).toBe("19:30");
    expect(result.current.matchDuration).toBe(40);
    expect(result.current.breakDuration).toBe(15);
  });

  it("replaces the current state from server data", () => {
    const { result } = renderHook(() => useTournament());

    act(() => {
      result.current.replaceState({
        players: [{ id: "p9", name: "Mia", gender: "w", strength: 3 }],
        rounds: [],
        courtCount: 4,
        courtNames: ["A", "B", "C", "D"],
      });
    });

    expect(result.current.players).toEqual([{ id: "p9", name: "Mia", gender: "w", strength: 3 }]);
    expect(result.current.courtCount).toBe(4);
    expect(result.current.courtNames).toEqual(["A", "B", "C", "D"]);
    expect(result.current.roundCount).toBe(5);
  });

  it("resets back to the default state", () => {
    const { result } = renderHook(() => useTournament());

    act(() => {
      result.current.setNewPlayer("Mia");
      result.current.addSinglePlayer();
      result.current.setPlayerInput("Ava\nNoah");
      result.current.clearAll();
    });

    expect(result.current.players).toEqual([]);
    expect(result.current.rounds).toEqual([]);
    expect(result.current.playerInput).toBe("");
    expect(result.current.newPlayer).toBe("");
    expect(result.current.newGender).toBe("m");
    expect(result.current.newStrength).toBe(3);
    expect(result.current.roundCount).toBe(5);
    expect(result.current.courtCount).toBe(2);
    expect(result.current.courtNames).toEqual(["Court 1", "Court 2"]);
    expect(result.current.startTime).toBe("18:00");
    expect(result.current.matchDuration).toBe(35);
    expect(result.current.breakDuration).toBe(10);
  });
});
