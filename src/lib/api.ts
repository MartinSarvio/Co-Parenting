/**
 * API Client — HTTP wrapper med JWT token management.
 *
 * Alle requests til backend går igennem dette modul.
 * Token gemmes i localStorage og tilføjes automatisk til headers.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'auth-token';

// ── Token helpers ──────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Error class ────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Core fetch wrapper ─────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new ApiError(0, 'Ingen forbindelse til serveren');
  }

  // 401 — only clear token for authenticated endpoints, not login/register
  if (res.status === 401) {
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register');
    if (!isAuthEndpoint) {
      clearToken();
    }
    // Parse the actual error message from backend
    const errData = await res.json().catch(() => null);
    const errMsg = (errData && typeof errData === 'object' && 'error' in errData)
      ? (errData as { error: string }).error
      : (isAuthEndpoint ? 'Forkert email eller adgangskode' : 'Session udløbet — log ind igen');
    throw new ApiError(401, errMsg);
  }

  // 204 No Content (DELETE responses)
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data ? (data as { error: string }).error : null) ??
      `Serverfejl (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

// ── Convenience methods ────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  setToken,
  getToken,
  clearToken,
};
