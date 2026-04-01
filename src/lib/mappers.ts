/**
 * Data Mappers — konverterer Supabase (snake_case) responses til frontend types (camelCase).
 */

import type {
  User,
  Child,
  Household,
  CalendarEvent,
  Task,
  Expense,
  Document,
  MealPlan,
  MessageThread,
  Message,
  Milestone,
  FamilyPhoto,
  DiaryEntry,
  KeyDate,
  DecisionLog,
  ShoppingItem,
  ShoppingList,
  Recipe,
  ProfessionalCase,
  RiskAssessment,
  ProfessionalDepartment,
  CaseActivity,
} from '@/types';

// ── Helpers ────────────────────────────────────────────────

/** Konverterer enhver dato/DateTime til ISO string */
function toISOString(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

/** Konverterer DateTime til YYYY-MM-DD dato-string */
function toDateString(val: unknown): string {
  const iso = toISOString(val);
  return iso ? iso.slice(0, 10) : '';
}

// ── Supabase row types (snake_case) ─────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  color: string;
  phone?: string | null;
  professional_type?: string | null;
  organization?: string | null;
  is_admin?: boolean;
  created_at?: string;
}

export interface DbChild {
  id: string;
  name: string;
  birth_date: string;
  avatar?: string | null;
  parent1_id: string;
  parent2_id: string;
  household_id: string;
  institution_name?: string | null;
  institution_type?: string | null;
  allergies: string[];
  medications: string[];
}

export interface DbHouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  role: string;
  user?: DbUser;
}

export interface DbCalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  type: string;
  child_id?: string | null;
  created_by: string;
  location?: string | null;
  assigned_to: string[];
  is_recurring: boolean;
}

export interface DbTask {
  id: string;
  title: string;
  description?: string | null;
  assigned_to: string;
  created_by: string;
  deadline?: string | null;
  completed: boolean;
  completed_at?: string | null;
  category: string;
  is_recurring: boolean;
  planned_weekday?: number | null;
  area?: string | null;
}

export interface DbExpense {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  split_with: string[];
  split_amounts: Record<string, number> | string;
  split_type: string;
  date: string;
  status: string;
  receipt_url?: string | null;
  approved_by: string[];
  is_recurring: boolean;
  created_at: string;
}

export interface DbDocument {
  id: string;
  title: string;
  type: string;
  url: string;
  uploaded_by: string;
  shared_with: string[];
  is_official: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  created_at: string;
}

export interface DbMealPlan {
  id: string;
  date: string;
  meal_type: string;
  title: string;
  notes?: string | null;
  created_by: string;
  recipe?: unknown;
  created_at: string;
}

export interface DbThread {
  id: string;
  title: string;
  participants: string[];
  child_id?: string | null;
  unread_count: number;
  deleted_by: string[];
  created_at: string;
  updated_at: string;
  messages?: DbMessage[];
  is_professional_thread?: boolean | null;
}

export interface DbMessage {
  id: string;
  content: string;
  sender_id: string;
  thread_id: string;
  read_by: string[];
  deleted_by: string[];
  attachments?: unknown;
  created_at: string;
}

export interface DbMilestone {
  id: string;
  child_id: string;
  title: string;
  description?: string | null;
  date: string;
  category: string;
  added_by: string;
  photos: string[];
  created_at: string;
}

export interface DbFamilyPhoto {
  id: string;
  child_id: string;
  url: string;
  caption?: string | null;
  taken_at: string;
  added_by: string;
  added_at: string;
}

export interface DbDiaryEntry {
  id: string;
  child_id: string;
  date: string;
  mood: string;
  sleep: string;
  appetite: string;
  note?: string | null;
  written_by: string;
  created_at: string;
}

export interface DbKeyDate {
  id: string;
  child_id?: string | null;
  title: string;
  date: string;
  type: string;
  recurrence: string;
  reminder_days_before: number;
  notes?: string | null;
  added_by: string;
  created_at: string;
}

export interface DbDecisionLog {
  id: string;
  child_id?: string | null;
  title: string;
  description: string;
  category: string;
  decided_at: string;
  proposed_by: string;
  approved_by: string[];
  status: string;
  notes?: string | null;
  created_at: string;
}

export interface DbShoppingItem {
  id: string;
  household_id: string;
  list_id?: string | null;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  category?: string | null;
  purchased: boolean;
  added_by: string;
  created_at: string;
}

export interface DbShoppingList {
  id: string;
  household_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface DbUserRecipe {
  id: string;
  household_id: string;
  name: string;
  ingredients: unknown;
  instructions?: string | null;
  image_url?: string | null;
  category?: string | null;
  shared_with_family: boolean;
  created_by: string;
  created_at: string;
}

// ── Mappers ────────────────────────────────────────────────

export function mapUser(raw: DbUser): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar ?? undefined,
    color: (raw.color as User['color']) || 'warm',
    phone: raw.phone ?? undefined,
    role: (raw.role as User['role']) || 'parent',
    isAdmin: raw.is_admin ?? false,
    professionalType: raw.professional_type as User['professionalType'],
    organization: raw.organization ?? undefined,
  };
}

export function mapChild(raw: DbChild): Child {
  return {
    id: raw.id,
    name: raw.name,
    birthDate: toDateString(raw.birth_date),
    avatar: raw.avatar ?? undefined,
    parent1Id: raw.parent1_id,
    parent2Id: raw.parent2_id,
    allergies: raw.allergies ?? [],
    medications: raw.medications ?? [],
    institutionName: raw.institution_name ?? undefined,
    institutionType: raw.institution_type as Child['institutionType'],
  };
}

export function mapHousehold(raw: { id: string; name: string; family_mode: string; case_number?: string | null }, members?: DbHouseholdMember[], children?: DbChild[]): Household {
  return {
    id: raw.id,
    name: raw.name,
    familyMode: (raw.family_mode as Household['familyMode']) || 'co_parenting',
    caseNumber: raw.case_number ?? undefined,
    members: members?.map(m => m.user_id) ?? [],
    children: children?.map(c => c.id) ?? [],
  };
}

export function extractUsersFromMembers(members: DbHouseholdMember[]): User[] {
  return members
    .filter(m => m.user)
    .map(m => mapUser(m.user!));
}

export function mapEvent(raw: DbCalendarEvent): CalendarEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    startDate: toISOString(raw.start_date),
    endDate: toISOString(raw.end_date),
    type: raw.type as CalendarEvent['type'],
    childId: raw.child_id ?? undefined,
    createdBy: raw.created_by,
    location: raw.location ?? undefined,
    assignedTo: raw.assigned_to ?? [],
    isRecurring: raw.is_recurring ?? false,
  };
}

export function mapTask(raw: DbTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    assignedTo: raw.assigned_to,
    createdBy: raw.created_by,
    deadline: raw.deadline ? toISOString(raw.deadline) : undefined,
    completed: raw.completed,
    completedAt: raw.completed_at ? toISOString(raw.completed_at) : undefined,
    category: raw.category as Task['category'],
    isRecurring: raw.is_recurring ?? false,
    plannedWeekday: raw.planned_weekday ?? undefined,
    area: raw.area ?? undefined,
  };
}

export function mapExpense(raw: DbExpense): Expense {
  const splitAmounts =
    typeof raw.split_amounts === 'string'
      ? JSON.parse(raw.split_amounts || '{}')
      : (raw.split_amounts ?? {});

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    amount: raw.amount,
    currency: raw.currency || 'DKK',
    category: raw.category as Expense['category'],
    paidBy: raw.paid_by,
    splitWith: raw.split_with ?? [],
    splitAmounts,
    splitType: (raw.split_type as Expense['splitType']) || 'equal',
    date: toDateString(raw.date),
    status: raw.status as Expense['status'],
    receiptUrl: raw.receipt_url ?? undefined,
    approvedBy: raw.approved_by ?? [],
    isRecurring: raw.is_recurring ?? false,
    createdAt: toISOString(raw.created_at),
  };
}

export function mapDocument(raw: DbDocument): Document {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type as Document['type'],
    url: raw.url,
    uploadedBy: raw.uploaded_by,
    uploadedAt: toISOString(raw.created_at),
    sharedWith: raw.shared_with ?? [],
    isOfficial: raw.is_official ?? false,
    validFrom: raw.valid_from ? toDateString(raw.valid_from) : undefined,
    validUntil: raw.valid_until ? toDateString(raw.valid_until) : undefined,
  };
}

export function mapMealPlan(raw: DbMealPlan): MealPlan {
  return {
    id: raw.id,
    date: raw.date,
    mealType: raw.meal_type as MealPlan['mealType'],
    title: raw.title,
    notes: raw.notes ?? undefined,
    createdBy: raw.created_by,
    createdAt: toISOString(raw.created_at),
    recipe: raw.recipe as MealPlan['recipe'],
  };
}

export function mapThread(raw: DbThread): MessageThread {
  const lastMsg = raw.messages?.[0];
  return {
    id: raw.id,
    title: raw.title,
    participants: raw.participants,
    childId: raw.child_id ?? undefined,
    unreadCount: raw.unread_count ?? 0,
    createdAt: toISOString(raw.created_at),
    deletedBy: raw.deleted_by ?? [],
    isProfessionalThread: raw.is_professional_thread ?? false,
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          content: lastMsg.content,
          senderId: lastMsg.sender_id,
          timestamp: toISOString(lastMsg.created_at),
          threadId: raw.id,
          readBy: lastMsg.read_by ?? [],
        }
      : undefined,
  };
}

export function mapMessage(raw: DbMessage): Message {
  return {
    id: raw.id,
    content: raw.content,
    senderId: raw.sender_id,
    timestamp: toISOString(raw.created_at),
    threadId: raw.thread_id,
    readBy: raw.read_by ?? [],
    deletedBy: raw.deleted_by ?? [],
    attachments: raw.attachments as Message['attachments'],
  };
}

export function mapMilestone(raw: DbMilestone): Milestone {
  return {
    id: raw.id,
    childId: raw.child_id,
    title: raw.title,
    description: raw.description ?? undefined,
    date: toDateString(raw.date),
    category: raw.category as Milestone['category'],
    addedBy: raw.added_by,
    photos: raw.photos ?? [],
  };
}

export function mapFamilyPhoto(raw: DbFamilyPhoto): FamilyPhoto {
  return {
    id: raw.id,
    childId: raw.child_id,
    url: raw.url,
    caption: raw.caption ?? undefined,
    takenAt: toISOString(raw.taken_at),
    addedBy: raw.added_by,
    addedAt: toISOString(raw.added_at),
  };
}

export function mapDiaryEntry(raw: DbDiaryEntry): DiaryEntry {
  return {
    id: raw.id,
    childId: raw.child_id,
    date: toDateString(raw.date),
    mood: raw.mood as DiaryEntry['mood'],
    sleep: raw.sleep as DiaryEntry['sleep'],
    appetite: raw.appetite as DiaryEntry['appetite'],
    note: raw.note ?? undefined,
    writtenBy: raw.written_by,
    createdAt: toISOString(raw.created_at),
  };
}

export function mapKeyDate(raw: DbKeyDate): KeyDate {
  return {
    id: raw.id,
    childId: raw.child_id ?? undefined,
    title: raw.title,
    date: toDateString(raw.date),
    type: raw.type as KeyDate['type'],
    recurrence: raw.recurrence as KeyDate['recurrence'],
    reminderDaysBefore: raw.reminder_days_before ?? 7,
    notes: raw.notes ?? undefined,
    addedBy: raw.added_by,
    createdAt: toISOString(raw.created_at),
  };
}

export function mapDecisionLog(raw: DbDecisionLog): DecisionLog {
  return {
    id: raw.id,
    childId: raw.child_id ?? undefined,
    title: raw.title,
    description: raw.description,
    category: raw.category as DecisionLog['category'],
    decidedAt: toISOString(raw.decided_at),
    proposedBy: raw.proposed_by,
    approvedBy: raw.approved_by ?? [],
    status: raw.status as DecisionLog['status'],
    notes: raw.notes ?? undefined,
    createdAt: toISOString(raw.created_at),
  };
}

export function mapShoppingItem(raw: DbShoppingItem): ShoppingItem {
  return {
    id: raw.id,
    name: raw.name,
    quantity: raw.quantity ?? undefined,
    purchased: raw.purchased,
    addedBy: raw.added_by,
    category: raw.category ?? undefined,
    listId: raw.list_id ?? undefined,
  };
}

export function mapShoppingList(raw: DbShoppingList): ShoppingList {
  return {
    id: raw.id,
    name: raw.name,
    createdAt: toISOString(raw.created_at),
    createdBy: raw.created_by,
  };
}

// ── Professional DB types ─────────────────────────────────

export interface DbProfessionalCase {
  id: string;
  case_number: string;
  department_id: string;
  municipality: string;
  family_name: string;
  parents: string[];
  child_name: string;
  child_age: number;
  status: string;
  priority: string;
  risk_level: string;
  last_contact?: string | null;
  next_meeting?: string | null;
  unread_messages: number;
  pending_approvals: number;
  notes: string;
  assigned_to: string;
  household_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRiskAssessment {
  id: string;
  case_id: string;
  assessor_id: string;
  assessment_date: string;
  risk_level: string;
  risk_factors: unknown;
  protective_factors?: string | null;
  summary?: string | null;
  recommendations?: string | null;
  status: string;
  sent_to: string[];
  created_at: string;
  updated_at: string;
}

export interface DbProfessionalDepartment {
  id: string;
  municipality: string;
  department_code: string;
  department_name: string;
  region?: string | null;
  created_at: string;
}

export interface DbCaseActivity {
  id: string;
  case_id: string;
  type: string;
  title: string;
  description?: string | null;
  related_id?: string | null;
  related_type?: string | null;
  created_by: string;
  created_at: string;
}

// ── Professional mappers ──────────────────────────────────

export function mapProfessionalCase(raw: DbProfessionalCase): ProfessionalCase {
  return {
    id: raw.id,
    caseNumber: raw.case_number,
    departmentId: raw.department_id,
    municipality: raw.municipality || '',
    familyName: raw.family_name,
    parents: raw.parents ?? [],
    childName: raw.child_name,
    childAge: raw.child_age,
    status: raw.status as ProfessionalCase['status'],
    priority: raw.priority as ProfessionalCase['priority'],
    riskLevel: raw.risk_level as ProfessionalCase['riskLevel'],
    lastContact: raw.last_contact ? toISOString(raw.last_contact) : '',
    nextMeeting: raw.next_meeting ? toISOString(raw.next_meeting) : '',
    unreadMessages: raw.unread_messages ?? 0,
    pendingApprovals: raw.pending_approvals ?? 0,
    notes: raw.notes || '',
    assignedTo: raw.assigned_to,
    householdId: raw.household_id ?? undefined,
    createdAt: toISOString(raw.created_at),
    updatedAt: toISOString(raw.updated_at),
  };
}

export function mapRiskAssessment(raw: DbRiskAssessment): RiskAssessment {
  return {
    id: raw.id,
    caseId: raw.case_id,
    assessorId: raw.assessor_id,
    assessmentDate: toDateString(raw.assessment_date),
    riskLevel: raw.risk_level as RiskAssessment['riskLevel'],
    riskFactors: Array.isArray(raw.risk_factors) ? raw.risk_factors as RiskAssessment['riskFactors'] : [],
    protectiveFactors: raw.protective_factors || '',
    summary: raw.summary || '',
    recommendations: raw.recommendations || '',
    status: raw.status as RiskAssessment['status'],
    sentTo: raw.sent_to ?? [],
    createdAt: toISOString(raw.created_at),
    updatedAt: toISOString(raw.updated_at),
  };
}

export function mapProfessionalDepartment(raw: DbProfessionalDepartment): ProfessionalDepartment {
  return {
    id: raw.id,
    municipality: raw.municipality,
    departmentCode: raw.department_code,
    departmentName: raw.department_name,
    region: raw.region || '',
  };
}

export function mapCaseActivity(raw: DbCaseActivity): CaseActivity {
  return {
    id: raw.id,
    caseId: raw.case_id,
    type: raw.type as CaseActivity['type'],
    title: raw.title,
    description: raw.description || '',
    relatedId: raw.related_id ?? undefined,
    relatedType: raw.related_type ?? undefined,
    createdBy: raw.created_by,
    createdAt: toISOString(raw.created_at),
  };
}

export function mapUserRecipe(raw: DbUserRecipe): Recipe {
  const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  return {
    id: raw.id,
    name: raw.name,
    description: '',
    category: raw.category || 'other',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    difficulty: 'medium',
    ingredients: ingredients as Recipe['ingredients'],
    steps: [],
    nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    tags: [],
    childFriendly: false,
    createdBy: raw.created_by,
    isUserRecipe: true,
    isShared: raw.shared_with_family,
  };
}
