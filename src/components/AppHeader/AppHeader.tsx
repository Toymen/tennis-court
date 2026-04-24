import { LuLock, LuLogIn, LuLogOut, LuRefreshCw, LuRotateCcw, LuSave, LuShuffle, LuSparkles } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  mode: "admin" | "view";
  adminUsername?: string | null;
  isDirty?: boolean;
  isSaving?: boolean;
  canGenerate: boolean;
  onGenerate?: () => void;
  onDemo?: () => void;
  onResetResults?: () => void;
  onClearAll?: () => void;
  onSave?: () => void;
  onRefresh?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
}

export function AppHeader({
  mode,
  adminUsername,
  isDirty = false,
  isSaving = false,
  canGenerate,
  onGenerate,
  onDemo,
  onResetResults,
  onClearAll,
  onSave,
  onRefresh,
  onOpenAdmin,
  onLogout,
}: AppHeaderProps) {
  const isAdmin = mode === "admin";

  return (
    <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-lime-500 p-8 text-white">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
            <LuSparkles className="h-4 w-4" />
            {isAdmin ? "Admin-Modus" : "Live-Ansicht"}
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Vierer-Kombinationen für Tennis-Doppel</h1>
          <p className="mt-3 max-w-3xl text-sm text-emerald-50 md:text-base">
            {isAdmin
              ? `Du bearbeitest den aktuellen Turnierstand${adminUsername ? ` als ${adminUsername}` : ""}.`
              : "Zuschauer sehen hier den aktuellen Turnierstand in einer reinen Leseansicht."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <>
              <Button onClick={onSave} disabled={!isDirty || isSaving} className="rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50">
                <LuSave className="mr-2 h-4 w-4" />
                {isSaving ? "Speichert..." : "Speichern"}
              </Button>
              <Button onClick={onGenerate} disabled={!canGenerate || isSaving} className="rounded-2xl bg-white/15 text-white hover:bg-white/20">
                <LuShuffle className="mr-2 h-4 w-4" />
                Turnier planen
              </Button>
              <Button variant="secondary" onClick={onDemo} disabled={isSaving} className="rounded-2xl bg-emerald-950/20 text-white hover:bg-emerald-950/30">
                Demo 20 Spieler
              </Button>
              <Button variant="secondary" onClick={onResetResults} disabled={isSaving} className="rounded-2xl bg-emerald-950/20 text-white hover:bg-emerald-950/30">
                <LuRotateCcw className="mr-2 h-4 w-4" />
                Ergebnisse leeren
              </Button>
              <Button variant="outline" onClick={onClearAll} disabled={isSaving} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Alles leeren
              </Button>
              <Button variant="outline" onClick={onLogout} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <LuLogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onRefresh} className="rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50">
                <LuRefreshCw className="mr-2 h-4 w-4" />
                Aktualisieren
              </Button>
              <Button variant="secondary" onClick={onOpenAdmin} className="rounded-2xl bg-emerald-950/20 text-white hover:bg-emerald-950/30">
                <LuLogIn className="mr-2 h-4 w-4" />
                Admin öffnen
              </Button>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm text-emerald-50">
                <LuLock className="h-4 w-4" />
                Nur Ansicht
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
