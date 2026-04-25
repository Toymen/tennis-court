import { normalizeTournamentState, type TournamentFormState } from "@/lib/tournamentState";

export interface TournamentResponse {
  slug: string;
  title: string;
  updatedAt: string | null;
  state: TournamentFormState;
}

export interface SessionResponse {
  authenticated: boolean;
  username: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Accept": "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    ...init,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(data?.error ?? "Unbekannter Serverfehler", response.status);
  }

  return data as T;
}

function mapTournament(data: TournamentResponse): TournamentResponse {
  return {
    ...data,
    state: normalizeTournamentState(data.state),
  };
}

export function getPublicTournament(slug: string) {
  return request<TournamentResponse>(`/api/public/get-tournament.php?slug=${encodeURIComponent(slug)}`).then(mapTournament);
}

export function getAdminTournament(slug: string) {
  return request<TournamentResponse>(`/api/admin/get-tournament.php?slug=${encodeURIComponent(slug)}`).then(mapTournament);
}

export function getAdminSession() {
  return request<SessionResponse>("/api/admin/check-session.php");
}

export function loginAdmin(username: string, password: string) {
  return request<SessionResponse>("/api/admin/login.php", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logoutAdmin() {
  return request<{ ok: true }>("/api/admin/logout.php", {
    method: "POST",
  });
}

export function saveAdminTournament(payload: { slug: string; title: string; state: TournamentFormState }) {
  return request<TournamentResponse>("/api/admin/save-tournament.php", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapTournament);
}
