/**
 * API Client — Supabase-baseret data-lag.
 *
 * Erstatter den gamle fetch-baserede Express API client.
 * Bruger Supabase client til direkte database-operationer
 * og returnerer data i camelCase (som de gamle mappers forventer).
 */

import { supabase, supabaseAdmin } from './supabase';

// ── Snake → Camel case converter ──────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

/** Konverterer alle nøgler i et objekt fra snake_case til camelCase */
export function toCamelCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as T;
  if (typeof obj !== 'object') return obj as T;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date))
      ? toCamelCase(value)
      : value;
  }
  return result as T;
}

/** Konverterer alle nøgler i et objekt fra camelCase til snake_case */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

// ── Auth helpers (Supabase session) ──────────────────────────

export function getToken(): string | null {
  // Supabase håndterer tokens internt
  return null;
}

export function setToken(_token: string): void {
  // No-op — Supabase håndterer tokens
}

export function clearToken(): void {
  supabase.auth.signOut();
}

// ── Error class ──────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Supabase CRUD helpers ────────────────────────────────────

/**
 * Generisk hent-funktion der læser fra en Supabase-tabel.
 * Returnerer data i camelCase.
 */
async function selectFrom<T>(
  table: string,
  options?: {
    columns?: string;
    filter?: Record<string, unknown>;
    eq?: [string, unknown];
    or?: string;
    order?: [string, { ascending: boolean }];
    single?: boolean;
  }
): Promise<T> {
  let query = supabase.from(table).select(options?.columns || '*');

  if (options?.eq) {
    query = query.eq(options.eq[0], options.eq[1]);
  }
  if (options?.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      query = query.eq(key, value);
    }
  }
  if (options?.or) {
    query = query.or(options.or);
  }
  if (options?.order) {
    query = query.order(options.order[0], { ascending: options.order[1].ascending });
  }

  if (options?.single) {
    const { data, error } = await query.single();
    if (error) throw new ApiError(400, error.message);
    return toCamelCase<T>(data);
  }

  const { data, error } = await query;
  if (error) throw new ApiError(400, error.message);
  return toCamelCase<T>(data as unknown);
}

async function insertInto<T>(table: string, data: Record<string, unknown>, useAdmin = false): Promise<T> {
  const snakeData = toSnakeCase(data);
  const client = useAdmin ? supabaseAdmin : supabase;
  const { data: result, error } = await client
    .from(table)
    .insert(snakeData)
    .select()
    .single();
  if (error) throw new ApiError(400, error.message);
  return toCamelCase<T>(result);
}

async function updateRow<T>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
  const snakeData = toSnakeCase(data);
  const { data: result, error } = await supabase
    .from(table)
    .update(snakeData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new ApiError(400, error.message);
  return toCamelCase<T>(result);
}

async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  if (error) throw new ApiError(400, error.message);
}

// ── Route-kompatibelt API ────────────────────────────────────
// Disse funktioner matcher de gamle Express-ruter så useApiActions
// og dataSync kan bruges med minimale ændringer.

type RouteHandler = (body?: unknown) => Promise<unknown>;

const routeHandlers: Record<string, Record<string, RouteHandler>> = {
  // ── AUTH ──
  'POST /api/auth/register': {
    handler: async (body: unknown) => {
      const { email, password, name, role, color } = body as Record<string, string>;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: role || 'parent', color: color || 'warm' } },
      });
      if (error) throw new ApiError(400, error.message);

      // Opdater profilen med ekstra data
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            name,
            role: role || 'parent',
            color: color || 'warm',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          })
          .eq('id', data.user.id);
      }

      // Hent profil
      const profile = data.user
        ? await selectFrom('profiles', { eq: ['id', data.user.id], single: true })
        : null;

      return { user: profile, token: data.session?.access_token };
    },
  } as unknown as Record<string, RouteHandler>,

  'POST /api/auth/login': {
    handler: async (body: unknown) => {
      const { email, password } = body as Record<string, string>;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      if (error) throw new ApiError(401, 'Forkert email eller adgangskode');

      const profile = await selectFrom('profiles', { eq: ['id', data.user.id], single: true });
      return { user: profile, token: data.session.access_token };
    },
  } as unknown as Record<string, RouteHandler>,

  'GET /api/auth/me': {
    handler: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ApiError(401, 'Ikke logget ind');
      const profile = await selectFrom('profiles', { eq: ['id', user.id], single: true });
      return { user: profile };
    },
  } as unknown as Record<string, RouteHandler>,
};

// ── Table mapping fra route til Supabase-tabel ──────────────

const TABLE_MAP: Record<string, string> = {
  '/api/children': 'children',
  '/api/events': 'calendar_events',
  '/api/tasks': 'tasks',
  '/api/expenses': 'expenses',
  '/api/documents': 'documents',
  '/api/meal-plans': 'meal_plans',
  '/api/decisions': 'decision_logs',
  '/api/key-dates': 'key_dates',
  '/api/diary': 'diary_entries',
  '/api/milestones': 'milestones',
  '/api/messages/threads': 'message_threads',
  '/api/household': 'households',
  '/api/custody-plans': 'custody_plans',
  '/api/shopping': 'shopping_items',
};

// ── Universelt API der matcher den gamle api.ts ──────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const routeKey = `${method} ${path}`;

  // Check for specific route handlers first
  if (routeHandlers[routeKey]) {
    return routeHandlers[routeKey].handler(body) as Promise<T>;
  }

  // Determine table from path
  const basePath = path.replace(/\/[^/]+$/, ''); // Remove trailing ID
  const idMatch = path.match(/\/([^/]+)$/);
  const _isCreate = method === 'POST' && !idMatch?.input?.match(/\/[a-z0-9]{20,}$/i);

  // Find table
  let table = TABLE_MAP[path] || TABLE_MAP[basePath];

  // Special: household endpoint with nested data
  if (path === '/api/household' && method === 'GET') {
    return handleHouseholdGet() as Promise<T>;
  }
  if (path === '/api/household' && method === 'POST') {
    return handleHouseholdCreate<T>(body as Record<string, unknown>);
  }

  // Special: messages in thread
  const threadMsgMatch = path.match(/\/api\/messages\/threads\/([^/]+)\/messages$/);
  if (threadMsgMatch) {
    if (method === 'GET') {
      return selectFrom<T>('messages', { filter: { thread_id: threadMsgMatch[1] } });
    }
    if (method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser();
      return insertInto<T>('messages', {
        ...(body as Record<string, unknown>),
        senderId: user?.id,
        threadId: threadMsgMatch[1],
      });
    }
  }

  // Special: approve expense
  const approveMatch = path.match(/\/api\/expenses\/([^/]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: expense } = await supabase
      .from('expenses')
      .select('approved_by')
      .eq('id', approveMatch[1])
      .single();
    const approvedBy = [...(expense?.approved_by || []), user?.id];
    return updateRow<T>('expenses', approveMatch[1], { approvedBy });
  }

  if (!table) {
    throw new ApiError(404, `Ukendt rute: ${path}`);
  }

  // Hent bruger-ID til queries der kræver det
  const { data: { user } } = await supabase.auth.getUser();

  switch (method) {
    case 'GET': {
      return selectFrom<T>(table);
    }

    case 'POST': {
      const insertData = { ...(body as Record<string, unknown>) };
      // Tilføj createdBy/addedBy/writtenBy automatisk
      if (table === 'calendar_events') insertData.createdBy = user?.id;
      if (table === 'tasks') insertData.createdBy = user?.id;
      if (table === 'expenses') insertData.paidBy = user?.id;
      if (table === 'documents') insertData.uploadedBy = user?.id;
      if (table === 'meal_plans') insertData.createdBy = user?.id;
      if (table === 'diary_entries') insertData.writtenBy = user?.id;
      if (table === 'milestones') insertData.addedBy = user?.id;
      if (table === 'key_dates') insertData.addedBy = user?.id;
      if (table === 'decision_logs') insertData.proposedBy = user?.id;
      if (table === 'messages') insertData.senderId = user?.id;
      if (table === 'message_threads' && insertData.participants) {
        // Sørg for at brugeren selv er deltager
        const parts = insertData.participants as string[];
        if (!parts.includes(user?.id || '')) {
          parts.push(user?.id || '');
        }
      }
      // Brug admin client til tabeller der har household-baseret RLS
      const needsAdmin = [
        'children', 'custody_plans', 'institutions',
      ].includes(table);
      return insertInto<T>(table, insertData, needsAdmin);
    }

    case 'PATCH': {
      const id = idMatch?.[1];
      if (!id) throw new ApiError(400, 'Mangler ID');
      return updateRow<T>(table, id, body as Record<string, unknown>);
    }

    case 'DELETE': {
      const deleteId = idMatch?.[1];
      if (!deleteId) throw new ApiError(400, 'Mangler ID');
      await deleteRow(table, deleteId);
      return undefined as T;
    }

    default:
      throw new ApiError(405, `Method ${method} ikke understøttet`);
  }
}

// ── Household special handler (nested data) ──────────────────

async function handleHouseholdGet() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, 'Ikke logget ind');

  // Find user's household memberships
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id);

  if (!memberships?.length) return [];

  const householdIds = memberships.map(m => m.household_id);

  // Hent households med members
  const results = [];
  for (const hId of householdIds) {
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', hId)
      .single();

    const { data: members } = await supabase
      .from('household_members')
      .select('id, user_id, role, profiles:user_id(id, email, name, avatar, role, color)')
      .eq('household_id', hId);

    const { data: children } = await supabase
      .from('children')
      .select('id, name, birth_date, avatar')
      .eq('household_id', hId);

    results.push({
      ...toCamelCase<Record<string, unknown>>(household),
      members: members?.map(m => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        user: toCamelCase((m as unknown as Record<string, unknown>).profiles),
      })) || [],
      children: children?.map(c => toCamelCase(c)) || [],
    });
  }

  return results;
}

// ── Household CREATE handler (POST /api/household) ──────────

async function handleHouseholdCreate<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, 'Ikke logget ind');

  // Bruger supabaseAdmin (service_role) til at bypasse RLS
  // da den nye bruger endnu ikke har en household_member record

  // 1. Create the household
  const snakeBody = toSnakeCase(body);
  const { data: household, error: hhErr } = await supabaseAdmin
    .from('households')
    .insert(snakeBody)
    .select()
    .single();
  if (hhErr) throw new ApiError(400, hhErr.message);

  // 2. Auto-create household_member for the creating user
  const { error: memberErr } = await supabaseAdmin
    .from('household_members')
    .insert({
      user_id: user.id,
      household_id: household.id,
      role: 'parent',
    });
  if (memberErr) throw new ApiError(400, memberErr.message);

  // 3. Fetch the user's profile for the response
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, avatar, role, color')
    .eq('id', user.id)
    .single();

  // 4. Return in the ApiHousehold format (with members array)
  const result = {
    ...toCamelCase<Record<string, unknown>>(household),
    members: [
      {
        id: user.id,
        userId: user.id,
        role: 'parent',
        user: profile
          ? {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar,
              role: profile.role,
              color: profile.color,
            }
          : {
              id: user.id,
              name: user.user_metadata?.name || 'Bruger',
              email: user.email || '',
              avatar: null,
              role: 'parent',
              color: 'warm',
            },
      },
    ],
    children: [],
  };

  return result as T;
}

// ── Convenience methods (kompatibelt med den gamle api.ts) ───

export const api = {
  get: <T>(path: string) => request<T>('GET', path),

  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),

  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),

  delete: <T = void>(path: string) => request<T>('DELETE', path),

  setToken,
  getToken,
  clearToken,
};
