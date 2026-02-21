/**
 * Data Mappers — konverterer backend (Prisma) responses til frontend types.
 *
 * Prisma returnerer DateTime som ISO-strenge (JSON serialization),
 * men vi sikrer konsistens og mapper nested relationer til flade IDs.
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

// ── User ───────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  color: string;
  phone?: string | null;
  professionalType?: string | null;
  organization?: string | null;
  isAdmin?: boolean;
  createdAt?: string;
}

export function mapUser(raw: ApiUser): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar ?? undefined,
    color: (raw.color as User['color']) || 'warm',
    phone: raw.phone ?? undefined,
    role: (raw.role as User['role']) || 'parent',
    isAdmin: raw.isAdmin ?? false,
    professionalType: raw.professionalType as User['professionalType'],
    organization: raw.organization ?? undefined,
  };
}

// ── Child ──────────────────────────────────────────────────

export interface ApiChild {
  id: string;
  name: string;
  birthDate: string;
  avatar?: string | null;
  parent1Id: string;
  parent2Id: string;
  householdId: string;
  institutionName?: string | null;
  institutionType?: string | null;
  allergies: string[];
  medications: string[];
  parent1?: { id: string; name: string; avatar?: string | null };
  parent2?: { id: string; name: string; avatar?: string | null };
}

export function mapChild(raw: ApiChild): Child {
  return {
    id: raw.id,
    name: raw.name,
    birthDate: toDateString(raw.birthDate),
    avatar: raw.avatar ?? undefined,
    parent1Id: raw.parent1Id,
    parent2Id: raw.parent2Id,
    allergies: raw.allergies ?? [],
    medications: raw.medications ?? [],
    institutionName: raw.institutionName ?? undefined,
    institutionType: raw.institutionType as Child['institutionType'],
  };
}

// ── Household ──────────────────────────────────────────────

export interface ApiHousehold {
  id: string;
  name: string;
  familyMode: string;
  caseNumber?: string | null;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: { id: string; name: string; avatar?: string | null; email: string; role: string; color: string };
  }>;
  children?: Array<{ id: string; name: string; birthDate: string; avatar?: string | null }>;
}

export function mapHousehold(raw: ApiHousehold): Household {
  return {
    id: raw.id,
    name: raw.name,
    familyMode: (raw.familyMode as Household['familyMode']) || 'co_parenting',
    caseNumber: raw.caseNumber ?? undefined,
    members: raw.members.map(m => m.user.id),
    children: raw.children?.map(c => c.id) ?? [],
  };
}

/** Ekstraher User-objekter fra household members */
export function extractUsersFromHousehold(raw: ApiHousehold): User[] {
  return raw.members.map(m =>
    mapUser({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatar: m.user.avatar,
      role: m.user.role,
      color: m.user.color,
    }),
  );
}

// ── CalendarEvent ──────────────────────────────────────────

export interface ApiCalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  type: string;
  childId?: string | null;
  createdBy: string;
  location?: string | null;
  assignedTo: string[];
  isRecurring: boolean;
  child?: { id: string; name: string } | null;
  creator?: { id: string; name: string; avatar?: string | null };
}

export function mapEvent(raw: ApiCalendarEvent): CalendarEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    startDate: toISOString(raw.startDate),
    endDate: toISOString(raw.endDate),
    type: raw.type as CalendarEvent['type'],
    childId: raw.childId ?? undefined,
    createdBy: raw.createdBy,
    location: raw.location ?? undefined,
    assignedTo: raw.assignedTo ?? [],
    isRecurring: raw.isRecurring ?? false,
  };
}

// ── Task ───────────────────────────────────────────────────

export interface ApiTask {
  id: string;
  title: string;
  description?: string | null;
  assignedTo: string;
  createdBy: string;
  deadline?: string | null;
  completed: boolean;
  completedAt?: string | null;
  category: string;
  isRecurring: boolean;
  plannedWeekday?: number | null;
  area?: string | null;
  creator?: { id: string; name: string; avatar?: string | null };
  assignee?: { id: string; name: string; avatar?: string | null };
}

export function mapTask(raw: ApiTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    assignedTo: raw.assignedTo,
    createdBy: raw.createdBy,
    deadline: raw.deadline ? toISOString(raw.deadline) : undefined,
    completed: raw.completed,
    completedAt: raw.completedAt ? toISOString(raw.completedAt) : undefined,
    category: raw.category as Task['category'],
    isRecurring: raw.isRecurring ?? false,
    plannedWeekday: raw.plannedWeekday ?? undefined,
    area: raw.area ?? undefined,
  };
}

// ── Expense ────────────────────────────────────────────────

export interface ApiExpense {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  splitWith: string[];
  splitAmounts: Record<string, number> | string;
  splitType: string;
  date: string;
  status: string;
  receiptUrl?: string | null;
  approvedBy: string[];
  isRecurring: boolean;
  createdAt: string;
  payer?: { id: string; name: string; avatar?: string | null };
}

export function mapExpense(raw: ApiExpense): Expense {
  const splitAmounts =
    typeof raw.splitAmounts === 'string'
      ? JSON.parse(raw.splitAmounts || '{}')
      : (raw.splitAmounts ?? {});

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    amount: raw.amount,
    currency: raw.currency || 'DKK',
    category: raw.category as Expense['category'],
    paidBy: raw.paidBy,
    splitWith: raw.splitWith ?? [],
    splitAmounts,
    splitType: (raw.splitType as Expense['splitType']) || 'equal',
    date: toDateString(raw.date),
    status: raw.status as Expense['status'],
    receiptUrl: raw.receiptUrl ?? undefined,
    approvedBy: raw.approvedBy ?? [],
    isRecurring: raw.isRecurring ?? false,
    createdAt: toISOString(raw.createdAt),
  };
}

// ── Document ───────────────────────────────────────────────

export interface ApiDocument {
  id: string;
  title: string;
  type: string;
  url: string;
  uploadedBy: string;
  sharedWith: string[];
  isOfficial: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt: string;
  uploader?: { id: string; name: string; avatar?: string | null };
}

export function mapDocument(raw: ApiDocument): Document {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type as Document['type'],
    url: raw.url,
    uploadedBy: raw.uploadedBy,
    uploadedAt: toISOString(raw.createdAt),
    sharedWith: raw.sharedWith ?? [],
    isOfficial: raw.isOfficial ?? false,
    validFrom: raw.validFrom ? toDateString(raw.validFrom) : undefined,
    validUntil: raw.validUntil ? toDateString(raw.validUntil) : undefined,
  };
}

// ── MealPlan ───────────────────────────────────────────────

export interface ApiMealPlan {
  id: string;
  date: string;
  mealType: string;
  title: string;
  notes?: string | null;
  createdBy: string;
  recipe?: unknown;
  createdAt: string;
}

export function mapMealPlan(raw: ApiMealPlan): MealPlan {
  return {
    id: raw.id,
    date: raw.date, // Already YYYY-MM-DD in backend
    mealType: raw.mealType as MealPlan['mealType'],
    title: raw.title,
    notes: raw.notes ?? undefined,
    createdBy: raw.createdBy,
    createdAt: toISOString(raw.createdAt),
    recipe: raw.recipe as MealPlan['recipe'],
  };
}

// ── MessageThread ──────────────────────────────────────────

export interface ApiThread {
  id: string;
  title: string;
  participants: string[];
  childId?: string | null;
  unreadCount: number;
  deletedBy: string[];
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    readBy: string[];
    sender?: { id: string; name: string; avatar?: string | null };
  }>;
}

export function mapThread(raw: ApiThread): MessageThread {
  const lastMsg = raw.messages?.[0];
  return {
    id: raw.id,
    title: raw.title,
    participants: raw.participants,
    childId: raw.childId ?? undefined,
    unreadCount: raw.unreadCount ?? 0,
    createdAt: toISOString(raw.createdAt),
    deletedBy: raw.deletedBy ?? [],
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          content: lastMsg.content,
          senderId: lastMsg.senderId,
          timestamp: toISOString(lastMsg.createdAt),
          threadId: raw.id,
          readBy: lastMsg.readBy ?? [],
        }
      : undefined,
  };
}

// ── Message ────────────────────────────────────────────────

export interface ApiMessage {
  id: string;
  content: string;
  senderId: string;
  threadId: string;
  readBy: string[];
  deletedBy: string[];
  attachments?: unknown;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string | null };
}

export function mapMessage(raw: ApiMessage): Message {
  return {
    id: raw.id,
    content: raw.content,
    senderId: raw.senderId,
    timestamp: toISOString(raw.createdAt),
    threadId: raw.threadId,
    readBy: raw.readBy ?? [],
    deletedBy: raw.deletedBy ?? [],
    attachments: raw.attachments as Message['attachments'],
  };
}

// ── Milestone ──────────────────────────────────────────────

export interface ApiMilestone {
  id: string;
  childId: string;
  title: string;
  description?: string | null;
  date: string;
  category: string;
  addedBy: string;
  photos: string[];
  createdAt: string;
}

export function mapMilestone(raw: ApiMilestone): Milestone {
  return {
    id: raw.id,
    childId: raw.childId,
    title: raw.title,
    description: raw.description ?? undefined,
    date: toDateString(raw.date),
    category: raw.category as Milestone['category'],
    addedBy: raw.addedBy,
    photos: raw.photos ?? [],
  };
}

// ── FamilyPhoto ────────────────────────────────────────────

export interface ApiFamilyPhoto {
  id: string;
  childId: string;
  url: string;
  caption?: string | null;
  takenAt: string;
  addedBy: string;
  addedAt: string;
}

export function mapFamilyPhoto(raw: ApiFamilyPhoto): FamilyPhoto {
  return {
    id: raw.id,
    childId: raw.childId,
    url: raw.url,
    caption: raw.caption ?? undefined,
    takenAt: toISOString(raw.takenAt),
    addedBy: raw.addedBy,
    addedAt: toISOString(raw.addedAt),
  };
}

// ── DiaryEntry ─────────────────────────────────────────────

export interface ApiDiaryEntry {
  id: string;
  childId: string;
  date: string;
  mood: string;
  sleep: string;
  appetite: string;
  note?: string | null;
  writtenBy: string;
  createdAt: string;
}

export function mapDiaryEntry(raw: ApiDiaryEntry): DiaryEntry {
  return {
    id: raw.id,
    childId: raw.childId,
    date: toDateString(raw.date),
    mood: raw.mood as DiaryEntry['mood'],
    sleep: raw.sleep as DiaryEntry['sleep'],
    appetite: raw.appetite as DiaryEntry['appetite'],
    note: raw.note ?? undefined,
    writtenBy: raw.writtenBy,
    createdAt: toISOString(raw.createdAt),
  };
}

// ── KeyDate ────────────────────────────────────────────────

export interface ApiKeyDate {
  id: string;
  childId?: string | null;
  title: string;
  date: string;
  type: string;
  recurrence: string;
  reminderDaysBefore: number;
  notes?: string | null;
  addedBy: string;
  createdAt: string;
}

export function mapKeyDate(raw: ApiKeyDate): KeyDate {
  return {
    id: raw.id,
    childId: raw.childId ?? undefined,
    title: raw.title,
    date: toDateString(raw.date),
    type: raw.type as KeyDate['type'],
    recurrence: raw.recurrence as KeyDate['recurrence'],
    reminderDaysBefore: raw.reminderDaysBefore ?? 7,
    notes: raw.notes ?? undefined,
    addedBy: raw.addedBy,
    createdAt: toISOString(raw.createdAt),
  };
}

// ── DecisionLog ────────────────────────────────────────────

export interface ApiDecisionLog {
  id: string;
  childId?: string | null;
  title: string;
  description: string;
  category: string;
  decidedAt: string;
  proposedBy: string;
  approvedBy: string[];
  status: string;
  validFrom?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
}

export function mapDecisionLog(raw: ApiDecisionLog): DecisionLog {
  return {
    id: raw.id,
    childId: raw.childId ?? undefined,
    title: raw.title,
    description: raw.description,
    category: raw.category as DecisionLog['category'],
    decidedAt: toISOString(raw.decidedAt),
    proposedBy: raw.proposedBy,
    approvedBy: raw.approvedBy ?? [],
    status: raw.status as DecisionLog['status'],
    validFrom: raw.validFrom ? toDateString(raw.validFrom) : undefined,
    validUntil: raw.validUntil ? toDateString(raw.validUntil) : undefined,
    notes: raw.notes ?? undefined,
    createdAt: toISOString(raw.createdAt),
  };
}
