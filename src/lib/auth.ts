/**
 * Auth helpers — register, login, session restore.
 *
 * Bruger Supabase Auth direkte.
 */

import { supabase } from './supabase';
import { toCamelCase, ApiError } from './api';
import { mapUser } from './mappers';
import type { User } from '@/types';

// ── Register ───────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'parent' | 'guardian' | 'professional';
  color?: 'warm' | 'cool' | 'neutral';
}

export async function registerUser(input: RegisterInput): Promise<{ user: User; token: string }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role || 'parent',
        color: input.color || 'warm',
      },
    },
  });

  if (error) throw new ApiError(400, error.message);
  if (!data.user) throw new ApiError(400, 'Registrering fejlede');

  // Opdater profilen med ekstra data
  await supabase
    .from('profiles')
    .update({
      name: input.name,
      role: input.role || 'parent',
      color: input.color || 'warm',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`,
    })
    .eq('id', data.user.id);

  // Hent profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    user: mapUser(toCamelCase(profile)),
    token: data.session?.access_token || '',
  };
}

// ── Login ──────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput): Promise<{ user: User; token: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.toLowerCase().trim(),
    password: input.password,
  });

  if (error) throw new ApiError(401, 'Forkert email eller adgangskode');

  // Hent profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    user: mapUser(toCamelCase(profile)),
    token: data.session.access_token,
  };
}

// ── Fetch current user (session restore) ───────────────────

export async function fetchMe(): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, 'Ikke logget ind');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) throw new ApiError(404, 'Profil ikke fundet');

  return mapUser(toCamelCase(profile));
}

// ── Password reset (send email) ─────────────────────────────

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'dk.hverdag.app://reset-password',
  });
  if (error) throw new ApiError(400, error.message);
}

// ── Update password (after reset or from settings) ──────────

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw new ApiError(400, error.message);
}

// ── Logout ─────────────────────────────────────────────────

export function logoutUser(): void {
  supabase.auth.signOut();
}
