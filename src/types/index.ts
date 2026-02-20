// User types
export type UserRole = 'parent' | 'guardian' | 'professional' | 'family_member';
export type FamilyMemberRole = 'teenager' | 'grandparent' | 'step_parent' | 'other_relative';
export type ProfessionalType = 'caseworker' | 'family_counselor' | 'lawyer' | 'mediator' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: 'warm' | 'cool' | 'neutral';
  phone?: string;
  role: UserRole;
  professionalType?: ProfessionalType;
  organization?: string;
  canAccessCases?: string[]; // IDs of households they can access
  address?: Address;
  familyMemberRole?: FamilyMemberRole;
  invitedBy?: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Institution types
export interface Institution {
  id: string;
  name: string;
  type: 'daycare' | 'school' | 'after_school' | 'other';
  address: Address;
  phone?: string;
  email?: string;
  contactPerson?: string;
  openingHours?: string;
  children: string[]; // Child IDs
}

// Child types
export interface Child {
  id: string;
  name: string;
  birthDate: string;
  avatar?: string;
  parent1Id: string;
  parent2Id: string;
  allergies?: string[];
  medications?: string[];
  emergencyContacts?: EmergencyContact[];
  institutions?: string[]; // Institution IDs
  institutionName?: string;
  institutionType?: 'vuggestue' | 'børnehave' | 'skole' | 'sfo' | 'none';
  custodyPlanId?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

// Household types
export interface Household {
  id: string;
  name: string;
  members: string[];
  children: string[];
  familyMode?: HouseholdMode;
  calendarSources?: CalendarSource[];
  subscription?: HouseholdSubscription;
  singleParentSupport?: SingleParentSupportSettings;
  custodyPlanId?: string;
  assignedProfessionals?: string[]; // IDs of professionals with access
  caseNumber?: string; // Official case number from authorities
  institutions?: string[];
}

export type HouseholdMode = 'co_parenting' | 'together' | 'blended' | 'single_parent';

export type SubscriptionPlan = 'free' | 'family_plus' | 'single_parent_plus';
export type BillingModel = 'shared' | 'separate';

export interface HouseholdSubscription {
  plan: SubscriptionPlan;
  billingModel: BillingModel;
  status: 'active' | 'inactive';
  startedAt: string;
  payerUserId?: string;
}

export interface SingleParentSupportSettings {
  evidenceVaultEnabled: boolean;
  autoArchiveReceipts: boolean;
  lawyerIds: string[];
}

export interface CalendarSource {
  id: string;
  name: string;
  type: 'work' | 'personal' | 'school' | 'other';
  url: string;
  enabled: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
}

// Custody plan types - Enhanced with flexible configuration
export type CustodyPattern = '7/7' | '10/4' | '14/0' | 'custom' | 'alternating' | 'weekday-weekend';

export interface CustodyPlan {
  id: string;
  name: string;
  pattern: CustodyPattern;
  startDate: string;
  childId: string;
  
  // Flexible day configuration
  swapDay: number; // 0=Monday, 6=Sunday
  swapTime: string; // e.g., "18:00"
  swapLocation?: PickupLocation;
  
  parent1Weeks?: number; // For 7/7: how many weeks parent 1 has
  parent2Weeks?: number; // For 7/7: how many weeks parent 2 has
  parent1Days: number[];
  parent2Days: number[];
  
  // Detailed weekly schedule
  weeklySchedule?: DaySchedule[];
  customWeekConfig?: CustomWeekConfig;
  
  customSchedule?: CustodyDay[];
  
  // Special arrangements
  holidays?: HolidayArrangement[];
  specialDays?: SpecialDay[];
  
  // Agreement details
  agreementDate?: string;
  agreementValidUntil?: string;
  agreementText?: string;
}

export interface PickupLocation {
  type: 'parent_home' | 'institution' | 'other';
  parentId?: string; // If parent_home
  institutionId?: string; // If institution
  otherAddress?: Address;
  notes?: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Monday, 6=Sunday
  parent1: {
    hasCustody: boolean;
    dropoff?: {
      time: string;
      location: PickupLocation;
    };
    pickup?: {
      time: string;
      location: PickupLocation;
    };
  };
  parent2: {
    hasCustody: boolean;
    dropoff?: {
      time: string;
      location: PickupLocation;
    };
    pickup?: {
      time: string;
      location: PickupLocation;
    };
  };
  institution?: {
    id: string;
    dropoffTime?: string;
    pickupTime?: string;
  };
}

export interface CustomWeekConfig {
  // 0=Monday, 6=Sunday
  handoverDays: number[];
  handoverTime: string;
  handoverContext: 'after_daycare' | 'specific_time';
  // Weekday -> parentId for even/odd week numbers
  evenWeekAssignments: string[];
  oddWeekAssignments: string[];
}

export interface CustodyDay {
  date: string;
  parentId: string;
  notes?: string;
  isSwapDay?: boolean;
  pickupLocation?: PickupLocation;
  childWellbeing?: ChildWellbeingNote;
}

export interface ChildWellbeingNote {
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'tired';
  sleepQuality?: 'good' | 'okay' | 'poor';
  ateWell?: boolean;
  notes?: string;
  reportedBy: string;
  reportedAt: string;
}

export interface HolidayArrangement {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  parentId: string;
  description?: string;
}

export interface SpecialDay {
  id: string;
  date: string;
  type: 'birthday' | 'holiday' | 'event';
  description: string;
  parentId?: string;
  alternateYears?: boolean;
}

// Meeting minutes / Referat types
export interface MeetingMinutes {
  id: string;
  householdId: string;
  title: string;
  date: string;
  location?: string;
  attendees: Attendee[];
  agenda: string;
  decisions: Decision[];
  agreements: Agreement[];
  nextSteps: NextStep[];
  writtenBy: string;
  approvedBy?: string[];
  status: 'draft' | 'pending_approval' | 'approved';
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
  isOfficial?: boolean;
  authorityReference?: string; // Reference to authority case
}

export interface Attendee {
  userId: string;
  attended: boolean;
  role: 'parent' | 'professional' | 'child';
}

export interface Decision {
  id: string;
  topic: string;
  decision: string;
  agreedBy: string[];
  effectiveDate?: string;
}

export interface Agreement {
  id: string;
  title: string;
  description: string;
  validFrom: string;
  validUntil?: string;
  agreedBy: string[];
}

export interface NextStep {
  id: string;
  description: string;
  assignedTo?: string;
  deadline?: string;
  completed: boolean;
}

// Expense types
export type ExpenseCategory = 'institution' | 'medical' | 'clothing' | 'activities' | 'school' | 'food' | 'transport' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'disputed';

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string;
  splitWith: string[];
  splitAmounts: Record<string, number>; // userId -> amount
  splitType: 'equal' | 'percentage' | 'fixed';
  date: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  childId?: string;
  institutionId?: string;
  createdAt: string;
  approvedBy?: string[];
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  nextDueDate?: string;
  isUnexpected?: boolean;
  receiptUrls?: string[];
  linkedTransferId?: string;
  disputeReason?: string;
  disputedBy?: string;
  disputedAt?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ExpenseSummary {
  totalPaid: Record<string, number>;
  totalOwed: Record<string, number>;
  netBalance: Record<string, number>;
}

export interface PaymentAccount {
  id: string;
  userId: string;
  provider: 'mobilepay' | 'bank' | 'card' | 'other';
  accountLabel: string;
  accountHandle: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface MoneyTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: 'requested' | 'sent' | 'completed' | 'declined';
  note?: string;
  expenseId?: string;
  createdAt: string;
  completedAt?: string;
}

// Calendar event types
export type EventType = 'school' | 'activity' | 'work' | 'personal' | 'handover' | 'appointment' | 'meeting' | 'institution';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: EventType;
  childId?: string;
  createdBy: string;
  assignedTo?: string[];
  location?: string;
  reminders?: number[];
  isRecurring?: boolean;
  recurringPattern?: string;
  institutionId?: string;
  sourceCalendarId?: string;
  sourceEventId?: string;
  isExternal?: boolean;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  createdBy: string;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  childId?: string;
  category: 'general' | 'shopping' | 'child' | 'handover' | 'meeting' | 'expense' | 'cleaning';
  isRecurring?: boolean;
  recurringPattern?: string;
  plannedWeekday?: number; // 0=Monday, 6=Sunday
  area?: string;
}

// Shopping list types
export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  purchased: boolean;
  purchasedBy?: string;
  purchasedAt?: string;
  addedBy: string;
  category?: string;
  childId?: string;
  neededForDate?: string; // YYYY-MM-DD
  neededForMealId?: string;
  priority?: 'low' | 'normal' | 'high';
  barcode?: string;
  source?: 'manual' | 'scanner' | 'open_food_facts';
  nutritionPer100g?: {
    energyKcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    salt?: number;
  };
  allergens?: string[];
}

// Meal planning types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  title: string;
  childId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringPattern?: 'weekly';
  recurringWeekday?: number; // 0=Monday, 6=Sunday
  sourceMealId?: string;
  recipe?: {
    name: string;
    ingredients: string[];
    instructions: string;
  };
}

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  threadId: string;
  attachments?: Attachment[];
  readBy: string[];
  deletedBy?: string[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
}

export interface MessageThread {
  id: string;
  title: string;
  participants: string[];
  childId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  isProfessionalThread?: boolean;
  deletedBy?: string[];
}

// Milestone types
export interface Milestone {
  id: string;
  childId: string;
  title: string;
  description?: string;
  date: string;
  category: 'health' | 'school' | 'development' | 'social';
  addedBy: string;
  photos?: string[];
}

// Document types
export type DocumentType = 'contract' | 'medical' | 'school' | 'insurance' | 'other' | 'meeting_minutes' | 'court_order' | 'custody_agreement' | 'authority_document';

export interface Document {
  id: string;
  childId?: string;
  title: string;
  type: DocumentType;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  sharedWith: string[];
  isOfficial?: boolean;
  authorityReference?: string;
  validFrom?: string;
  validUntil?: string;
}

// Handover types
export interface Handover {
  id: string;
  childId: string;
  fromParentId: string;
  toParentId: string;
  scheduledDate: string;
  completedDate?: string;
  checklist: HandoverChecklistItem[];
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  location?: PickupLocation;
  childWellbeing?: ChildWellbeingNote;
  institutionHandover?: boolean;
}

export interface HandoverChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  category?: 'clothing' | 'school' | 'health' | 'toys' | 'other';
}

// Notification types
export type NotificationType = 
  | 'handover_reminder' 
  | 'task_due' 
  | 'event_reminder' 
  | 'message' 
  | 'expense_pending'
  | 'schedule_change'
  | 'meeting_minutes'
  | 'professional_message'
  | 'expense_approved'
  | 'expense_disputed'
  | 'document_shared'
  | 'meal_plan'
  | 'shopping_reminder'
  | 'cleaning_reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

// Photo album types
export interface FamilyPhoto {
  id: string;
  childId: string;
  url: string; // base64 or object URL
  caption?: string;
  takenAt: string; // ISO date
  addedBy: string;
  addedAt: string;
}

// Handover diary entry
export interface DiaryEntry {
  id: string;
  childId: string;
  handoverId?: string;
  date: string; // ISO date
  mood: 'happy' | 'neutral' | 'tired' | 'sad' | 'anxious';
  sleep: 'good' | 'okay' | 'poor';
  appetite: 'good' | 'okay' | 'poor';
  note?: string;
  writtenBy: string;
  createdAt: string;
}

// Key dates (birthdays, vaccinations, important events)
export interface KeyDate {
  id: string;
  childId?: string;
  title: string;
  date: string; // ISO date (YYYY-MM-DD)
  type: 'birthday' | 'vaccination' | 'school' | 'appointment' | 'anniversary' | 'other';
  recurrence: 'once' | 'yearly';
  reminderDaysBefore: number;
  notes?: string;
  addedBy: string;
  createdAt: string;
}

// Decision log
export interface DecisionLog {
  id: string;
  childId?: string;
  title: string;
  description: string;
  category: 'school' | 'health' | 'activity' | 'travel' | 'finance' | 'other';
  decidedAt: string; // ISO date
  proposedBy: string;
  approvedBy: string[]; // user IDs
  status: 'proposed' | 'approved' | 'rejected';
  validFrom?: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
}

// Calendar event template
export interface EventTemplate {
  id: string;
  title: string;
  type: EventType;
  duration: number; // minutes
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  notifyPartner?: boolean;
  autoTimer?: boolean;
}

// Calendar color preferences (eventType → hex color)
export type CalendarColorPreferences = Record<string, string>;

// Calendar sharing between co-parents
export type CalendarSharingStatus = 'not_requested' | 'pending' | 'accepted' | 'rejected';
export interface CalendarSharing {
  requestedBy: string;
  requestedAt: string;
  status: CalendarSharingStatus;
  acceptedAt?: string;
}

// Fridge item (persisted)
export interface FridgeItem {
  id: string;
  name: string;
  barcode?: string;
  addedAt: string;
  addedBy: string;
  expiresAt?: string;
  nutritionPer100g?: {
    energyKcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    salt?: number;
  };
  allergens?: string[];
}

// Recipe system
export type RecipeUnit = 'g' | 'kg' | 'ml' | 'dl' | 'l' | 'stk' | 'spsk' | 'tsk' | 'knivspids';

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: RecipeUnit;
}

export interface RecipeStep {
  step: number;
  description: string;
  duration?: number; // minutes
}

export interface RecipeNutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition; // per serving
  tags: string[];
  childFriendly: boolean;
  // User-created recipe fields
  createdBy?: string; // user id
  isUserRecipe?: boolean;
  isShared?: boolean; // shared with all household members
}

// App state
export interface AppState {
  currentUser: User | null;
  currentChild: Child | null;
  household: Household | null;
  isLoading: boolean;
  activeTab: string;
}
