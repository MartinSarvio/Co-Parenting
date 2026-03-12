/**
 * Auth helpers — register, login, session restore.
 *
 * Bruger Supabase Auth direkte.
 */

import { supabase } from './supabase';
import type { User } from '@/types';

// ── Helpers ──────────────────────────────────────────────────

function mapProfileToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    email: (row.email as string) || '',
    avatar: (row.avatar as string) ?? undefined,
    color: ((row.color as string) || 'warm') as User['color'],
    phone: (row.phone as string) ?? undefined,
    role: ((row.role as string) || 'parent') as User['role'],
    isAdmin: (row.is_admin as boolean) ?? false,
    professionalType: (row.professional_type as User['professionalType']) ?? undefined,
    organization: (row.organization as string) ?? undefined,
  };
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
  const { data: authData, error: authError } = await supabase.auth.signUp({
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

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Registrering fejlede');

  // Upsert profil i profiles-tabellen
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`;
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: input.email.toLowerCase().trim(),
      name: input.name,
      role: input.role || 'parent',
      color: input.color || 'warm',
      avatar: avatarUrl,
      password_hash: 'SUPABASE_AUTH',
    }, { onConflict: 'id' });

  if (profileError) console.warn('Profil upsert warning:', profileError);

  // Hent profilen
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  return {
    user: profile ? mapProfileToUser(profile) : {
      id: authData.user.id,
      name: input.name,
      email: input.email,
      color: (input.color || 'warm') as User['color'],
      role: (input.role || 'parent') as User['role'],
      isAdmin: false,
      avatar: avatarUrl,
    },
    token: authData.session?.access_token || '',
  };
}

// ── Login ──────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput): Promise<{ user: User; token: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Forkert email eller adgangskode'
        : error.message,
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) throw new Error('Profil ikke fundet');

  return {
    user: mapProfileToUser(profile),
    token: data.session.access_token,
  };
}

// ── Fetch current user (session restore) ───────────────────

export async function fetchMe(): Promise<User> {
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser) throw { status: 401, message: 'Session udløbet' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!profile) throw { status: 404, message: 'Profil ikke fundet' };
  return mapProfileToUser(profile);
}

// ── Reset password ────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  // Migrér gammel bruger til Supabase Auth hvis nødvendigt
  await supabase.functions.invoke('migrate-user', {
    body: { email: email.toLowerCase().trim() },
  });

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.toLowerCase().trim(),
  );
  if (error) throw new Error(error.message);
}

// ── Delete account (GDPR) ─────────────────────────────────

/**
 * Sletter brugerens konto via Supabase RPC.
 * RPC-funktionen anonymiserer alle persondata og sletter Auth-brugeren.
 * Kør docs/migration-delete-account.sql i Supabase SQL Editor først.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message || 'Kontosletning fejlede');

  // Log ud lokalt (session er allerede ugyldig efter auth.users DELETE)
  await supabase.auth.signOut();
}

// ── Logout ─────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
