import { LuMedal } from "react-icons/lu";
import { Card, CardContent } from "@/components/ui/card";
import type { PlayerStats } from "@/types";

interface WinnerBannerProps {
  winner: PlayerStats;
}

export function WinnerBanner({ winner }: WinnerBannerProps) {
  return (
    <Card className="rounded-[2rem] border-0 bg-gradient-to-r from-amber-50 via-white to-amber-100 shadow-2xl">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-amber-400 p-4 text-white shadow-lg">
            <LuMedal className="h-8 w-8" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-amber-700">Aktueller Gesamtsieger</div>
            <div className="text-2xl font-bold text-slate-900">{winner.name}</div>
            <div className="text-sm text-slate-600">
              {winner.points} Punkte · {winner.wins} Siege
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
