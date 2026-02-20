/**
 * Auth helpers — register, login, session restore.
 *
 * Bruger api-client fra ./api.ts og mappers fra ./mappers.ts.
 */

import { api } from './api';
import { mapUser } from './mappers';
import type { ApiUser } from './mappers';
import type { User } from '@/types';

// ── Response types fra backend ─────────────────────────────

interface AuthResponse {
  user: ApiUser;
  token: string;
}

interface MeResponse {
  user: ApiUser;
}

// ── Register ───────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'parent' | 'guardian' | 'professional';
  color?: 'warm' | 'cool' | 'neutral';
}

export async function registerUser(input: RegisterInput): Promise<{ user: User; token: string }> {
  const res = await api.post<AuthResponse>('/api/auth/register', input);
  api.setToken(res.token);
  return {
    user: mapUser(res.user),
    token: res.token,
  };
}

// ── Login ──────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput): Promise<{ user: User; token: string }> {
  const res = await api.post<AuthResponse>('/api/auth/login', input);
  api.setToken(res.token);
  return {
    user: mapUser(res.user),
    token: res.token,
  };
}

// ── Fetch current user (session restore) ───────────────────

export async function fetchMe(): Promise<User> {
  const res = await api.get<MeResponse>('/api/auth/me');
  return mapUser(res.user);
}

// ── Logout ─────────────────────────────────────────────────

export function logoutUser(): void {
  api.clearToken();
}
