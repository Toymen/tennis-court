import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { CourtSetup } from "@/components/CourtSetup/CourtSetup";
import { LeaderboardTable } from "@/components/LeaderboardTable/LeaderboardTable";
import { PlayerSetup } from "@/components/PlayerSetup/PlayerSetup";
import { PrintSectionButton } from "@/components/PrintSectionButton/PrintSectionButton";
import { RoundPanel } from "@/components/RoundPanel/RoundPanel";
import { WinnerBanner } from "@/components/WinnerBanner/WinnerBanner";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/useTournament";
import { ApiError, getAdminSession, getAdminTournament, getPublicTournament, loginAdmin, logoutAdmin, saveAdminTournament } from "@/lib/api";
import { createDefaultTournamentState, type TournamentFormState } from "@/lib/tournamentState";
import { LuCalendarRange, LuExternalLink, LuShieldCheck, LuTrophy } from "react-icons/lu";

type AppMode = "admin" | "view";

interface AppRoute {
  mode: AppMode;
  slug: string;
}

const DEFAULT_SLUG = "clubabend";
const DEFAULT_TITLE = "TC Heide 1975";
const VIEW_REFRESH_MS = 30000;

function parseRoute(pathname: string, hash: string): AppRoute {
  const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (pathSegments[0] === "admin") {
    return { mode: "admin", slug: pathSegments[1] ?? DEFAULT_SLUG };
  }

  if (pathSegments[0] === "view") {
    return { mode: "view", slug: pathSegments[1] ?? DEFAULT_SLUG };
  }

  const trimmed = hash.replace(/^#\/?/, "");
  const segments = trimmed.split("/").filter(Boolean);

  if (segments[0] === "admin") {
    return { mode: "admin", slug: segments[1] ?? DEFAULT_SLUG };
  }

  if (segments[0] === "view") {
    return { mode: "view", slug: segments[1] ?? DEFAULT_SLUG };
  }

  return { mode: "view", slug: DEFAULT_SLUG };
}

function routePath(mode: AppMode, slug: string) {
  return mode === "admin" ? `/admin/${slug}` : `/view/${slug}`;
}

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "noch nicht gespeichert";
  }

  const value = new Date(updatedAt.replace(" ", "T"));
  if (Number.isNaN(value.getTime())) {
    return updatedAt;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Es ist ein unbekannter Fehler aufgetreten.";
}

const noopFieldChange = () => {};

export default function App() {
  const tournament = useTournament();
  const { replaceState } = tournament;
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname, window.location.hash));
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [loginName, setLoginName] = useState("Andreas");
  const [loginPassword, setLoginPassword] = useState("");
  const [tournamentTitle, setTournamentTitle] = useState(DEFAULT_TITLE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(createDefaultTournamentState()));

  const isAdmin = route.mode === "admin";
  const isAuthenticated = isAdmin && !!adminUsername;
  const isReadOnly = !isAuthenticated;

  const currentRoundId = selectedRoundId && tournament.rounds.some((round) => round.id === selectedRoundId)
    ? selectedRoundId
    : tournament.rounds[0]?.id;

  const stateSnapshot = useMemo(() => JSON.stringify(tournament.state), [tournament.state]);
  const isDirty = isAuthenticated && !isLoading && stateSnapshot !== savedSnapshot;

  const applyTournamentData = useCallback((payload: { title: string; updatedAt: string | null; state: TournamentFormState }) => {
    setTournamentTitle(payload.title || DEFAULT_TITLE);
    setUpdatedAt(payload.updatedAt);
    replaceState(payload.state);
    const snapshot = JSON.stringify(payload.state);
    setSavedSnapshot(snapshot);
    setSelectedRoundId(payload.state.rounds[0]?.id);
  }, [replaceState]);

  const loadPublicData = useCallback(async (slug: string, silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    setError(null);

    try {
      const payload = await getPublicTournament(slug);
      applyTournamentData(payload);
      setInfo(`Live-Ansicht aktualisiert: ${formatUpdatedAt(payload.updatedAt)}`);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [applyTournamentData]);

  const loadAdminData = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await getAdminTournament(slug);
      applyTournamentData(payload);
      setInfo(`Admin-Ansicht geladen. Letzte Speicherung: ${formatUpdatedAt(payload.updatedAt)}`);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) {
        const initial = createDefaultTournamentState();
        replaceState(initial);
        setSavedSnapshot(JSON.stringify(initial));
        setTournamentTitle(DEFAULT_TITLE);
        setUpdatedAt(null);
        setInfo("Neues Turnier vorbereitet. Nach dem ersten Speichern ist es auch für Zuschauer sichtbar.");
      } else {
        setError(errorMessage(loadError));
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyTournamentData, replaceState]);

  useEffect(() => {
    const handleRouteChange = () => setRoute(parseRoute(window.location.pathname, window.location.hash));
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    window.history.pushState(null, "", routePath(nextRoute.mode, nextRoute.slug));
    setRoute(nextRoute);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      setInfo(null);

      if (route.mode === "view") {
        setAuthChecked(true);
        setAdminUsername(null);
        await loadPublicData(route.slug);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const session = await getAdminSession();
        if (!active) {
          return;
        }

        setAuthChecked(true);
        setAdminUsername(session.authenticated ? session.username : null);

        if (session.authenticated) {
          await loadAdminData(route.slug);
        } else {
          const initial = createDefaultTournamentState();
          setTournamentTitle(DEFAULT_TITLE);
          setUpdatedAt(null);
          replaceState(initial);
          setSavedSnapshot(JSON.stringify(initial));
          setIsLoading(false);
        }
      } catch (sessionError) {
        if (!active) {
          return;
        }

        setAuthChecked(true);
        setAdminUsername(null);
        setError(errorMessage(sessionError));
        setIsLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [route.mode, route.slug, loadAdminData, loadPublicData, replaceState]);

  useEffect(() => {
    if (route.mode !== "view") {
      return;
    }

    const interval = window.setInterval(() => {
      void loadPublicData(route.slug, true);
    }, VIEW_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [loadPublicData, route.mode, route.slug]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const session = await loginAdmin(loginName, loginPassword);
      setAdminUsername(session.username);
      setLoginPassword("");
      await loadAdminData(route.slug);
    } catch (loginError) {
      setError(errorMessage(loginError));
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const payload = await saveAdminTournament({
        slug: route.slug,
        title: tournamentTitle,
        state: tournament.state,
      });

      applyTournamentData(payload);
      setInfo(`Gespeichert: ${formatUpdatedAt(payload.updatedAt)}`);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } finally {
      setAdminUsername(null);
      navigate({ mode: "view", slug: route.slug });
    }
  }

  function openAdminMode() {
    navigate({ mode: "admin", slug: route.slug });
  }

  function openViewMode() {
    navigate({ mode: "view", slug: route.slug });
  }

  if (isAdmin && authChecked && !adminUsername) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#14532d,_#052e16_55%,_#022c22)] p-6 text-slate-900">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-lime-500 p-8 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
                <LuShieldCheck className="h-4 w-4" />
                Admin-Login
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">Turnierverwaltung</h1>
              <p className="mt-3 max-w-2xl text-sm text-emerald-50 md:text-base">
                Nur der Admin kann Spieler, Runden und Ergebnisse bearbeiten. Zuschauer bleiben auf der Live-Ansicht.
              </p>
            </div>
            <CardContent className="space-y-6 p-6">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Benutzername</Label>
                  <Input id="admin-name" value={loginName} onChange={(event) => setLoginName(event.target.value)} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Passwort</Label>
                  <Input id="admin-password" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className="rounded-2xl" />
                </div>
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isLoading} className="rounded-2xl bg-emerald-700 hover:bg-emerald-800">
                    {isLoading ? "Prüft..." : "Einloggen"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={openViewMode} className="rounded-2xl bg-emerald-100 text-emerald-900 hover:bg-emerald-200">
                    Zur Live-Ansicht
                  </Button>
                </div>
              </form>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                Zuschauer-Link:
                {" "}
                <button type="button" onClick={openViewMode} className="font-semibold underline underline-offset-4">
                  {routePath("view", route.slug)}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#14532d,_#052e16_55%,_#022c22)] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <AppHeader
            mode={isAuthenticated ? "admin" : "view"}
            adminUsername={adminUsername}
            isDirty={isDirty}
            isSaving={isSaving}
            canGenerate={tournament.players.length >= 4}
            onSave={handleSave}
            onGenerate={tournament.generateTournament}
            onDemo={tournament.generateDemo}
            onResetResults={tournament.resetResults}
            onClearAll={tournament.clearAll}
            onRefresh={() => void loadPublicData(route.slug)}
            onOpenAdmin={openAdminMode}
            onLogout={() => void handleLogout()}
          />

          <div className="grid gap-4 border-b border-emerald-100 bg-emerald-50/70 px-6 py-4 text-sm text-emerald-950 md:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <div><strong>Turnier:</strong> {route.slug}</div>
              <div><strong>Letzte Speicherung:</strong> {formatUpdatedAt(updatedAt)}</div>
              {info && <div>{info}</div>}
              {error && <div className="text-rose-700">{error}</div>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={openViewMode} className="rounded-2xl bg-white text-emerald-900 hover:bg-emerald-100">
                <LuExternalLink className="mr-2 h-4 w-4" />
                Zuschaueransicht
              </Button>
              {!isAuthenticated && (
                <Button variant="secondary" onClick={openAdminMode} className="rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800">
                  Admin-Modus
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <PlayerSetup
              players={tournament.players}
              playerInput={tournament.playerInput}
              newPlayer={tournament.newPlayer}
              newGender={tournament.newGender}
              newStrength={tournament.newStrength}
              readOnly={isReadOnly}
              stats={tournament.playerStats}
              roundCount={tournament.roundCount}
              onPlayerInputChange={tournament.setPlayerInput}
              onNewPlayerChange={tournament.setNewPlayer}
              onNewGenderChange={tournament.setNewGender}
              onNewStrengthChange={tournament.setNewStrength}
              onRoundCountChange={(value) => tournament.setRoundCount(Number(value))}
              onAddSingle={tournament.addSinglePlayer}
              onAddBulk={tournament.addBulkPlayers}
              onRemove={tournament.removePlayer}
            />
            <CourtSetup
              courtCount={tournament.courtCount}
              courtNames={tournament.courtNames}
              startTime={tournament.startTime}
              matchDuration={tournament.matchDuration}
              breakDuration={tournament.breakDuration}
              totalEventEnd={tournament.totalEventEnd}
              readOnly={isReadOnly}
              onCourtCountChange={tournament.updateCourtCount}
              onCourtNameChange={tournament.updateCourtName}
              onStartTimeChange={tournament.setStartTime}
              onMatchDurationChange={(value) => tournament.setMatchDuration(Number(value))}
              onBreakDurationChange={(value) => tournament.setBreakDuration(Number(value))}
            />
          </div>
        </section>

        {tournament.winner && <WinnerBanner winner={tournament.winner} />}

        <Card className="rounded-[2rem] border-0 bg-white/95 shadow-2xl">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <LuCalendarRange className="h-5 w-5" />
              Rundenplan und Ergebnisse
            </CardTitle>
            {currentRoundId && (
              <PrintSectionButton
                targetId={`round-print-${currentRoundId}`}
                label={isReadOnly ? "Aktuelle Runde drucken" : "Aktuelle Runde drucken"}
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 p-10 text-center text-slate-500">
                Daten werden geladen...
              </div>
            ) : tournament.rounds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 p-10 text-center text-slate-500">
                {isAuthenticated
                  ? "Noch kein Turnier geplant. Spieler anlegen und dann speichern."
                  : "Noch kein veröffentlichter Turnierplan vorhanden."}
              </div>
            ) : (
              <Tabs value={currentRoundId} onValueChange={setSelectedRoundId} className="space-y-5">
                <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-emerald-50 p-2">
                  {tournament.rounds.map((round) => (
                    <TabsTrigger key={round.id} value={round.id} className="rounded-2xl data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
                      Runde {round.roundNumber}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tournament.rounds.map((round) => (
                  <TabsContent key={round.id} value={round.id} className="space-y-5">
                    <div id={`round-print-${round.id}`}>
                      <RoundPanel round={round} readOnly={isReadOnly} onFieldChange={isReadOnly ? noopFieldChange : tournament.updateMatchField} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 bg-white/95 shadow-2xl">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <LuTrophy className="h-5 w-5" />
              Gesamtwertung
            </CardTitle>
            {tournament.leaderboard.length > 0 && (
              <PrintSectionButton targetId="leaderboard-print" label="Gesamtwertung drucken" />
            )}
          </CardHeader>
          <CardContent id="leaderboard-print">
            <LeaderboardTable leaderboard={tournament.leaderboard} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
