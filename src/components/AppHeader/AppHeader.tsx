import { LuRotateCcw, LuShuffle, LuSparkles } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  canGenerate: boolean;
  onGenerate: () => void;
  onDemo: () => void;
  onResetResults: () => void;
  onClearAll: () => void;
}

export function AppHeader({ canGenerate, onGenerate, onDemo, onResetResults, onClearAll }: AppHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-lime-500 p-8 text-white">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
            <LuSparkles className="h-4 w-4" />
            Tennisclub Fun Cup
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Vierer-Kombinationen für Tennis-Doppel</h1>
          <p className="mt-3 max-w-3xl text-sm text-emerald-50 md:text-base">
            Plane lockere Doppelrunden mit wechselnden Partnern, Court-Zuweisung, Pausenrotation und Gesamtwertung.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={!canGenerate} className="rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50">
            <LuShuffle className="mr-2 h-4 w-4" />
            Turnier planen
          </Button>
          <Button variant="secondary" onClick={onDemo} className="rounded-2xl bg-emerald-950/20 text-white hover:bg-emerald-950/30">
            Demo 20 Spieler
          </Button>
          <Button variant="secondary" onClick={onResetResults} className="rounded-2xl bg-emerald-950/20 text-white hover:bg-emerald-950/30">
            <LuRotateCcw className="mr-2 h-4 w-4" />
            Ergebnisse leeren
          </Button>
          <Button variant="outline" onClick={onClearAll} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
            Alles leeren
          </Button>
        </div>
      </div>
    </div>
  );
}
