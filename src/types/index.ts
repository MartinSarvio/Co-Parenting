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
  isAdmin?: boolean;
  professionalType?: ProfessionalType;
  organization?: string;
  canAccessCases?: string[]; // IDs of households they can access
  address?: Address;
  familyMemberRole?: FamilyMemberRole;
  invitedBy?: string;
  municipality?: string; // Kommune-tilhørsforhold (professionelle)
  allergies?: string[];
  profileVisibility?: {
    showEmail?: boolean;
    showPhone?: boolean;
    showAddress?: boolean;
    bio?: string;
  };
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
  sharedMeals?: boolean; // Co-parent opt-in for delt madplan
}

export type HouseholdMode = 'co_parenting' | 'together' | 'blended' | 'single_parent';

export interface NutritionGoals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

export interface CustomMealDef {
  key: string;
  emoji: string;
  label: string;
  color: string;
}

export interface MemberDisplayPrefs {
  numberFormat: 'decimal' | 'fraction';
  displayFormat: 'absolute' | 'percent';
  macroDisplayMode: 'gram' | 'percent';
  customMeals: CustomMealDef[];
}

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
export type CustodyPattern = '7/7' | '10/4' | '14/0' | 'custom' | 'alternating' | 'weekday-weekend' | 'supervised' | 'supervised_limited';

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

  // Supervised visitation settings
  supervisedConfig?: {
    frequencyWeeks: number;      // every X weeks
    durationHours: number;       // how many hours per visit
    location: string;            // e.g., "offentligt sted", address
    locationType: 'public' | 'home' | 'institution' | 'other';
    supervisorRequired: boolean;
    supervisorName?: string;
    specificDays?: number[];     // weekdays (0-6)
    startTime?: string;          // e.g., "10:00"
    notes?: string;
  };

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
  handoverContext: 'after_daycare' | 'specific_time' | 'public_place' | 'specific_days';
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
  alternateYears?: boolean;
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
  participants?: string[]; // user IDs for together-mode multi-assignment
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
  listId?: string;  // references ShoppingList.id
}

export interface ShoppingList {
  id: string;
  name: string;
  scheduledDate?: string; // YYYY-MM-DD — hvornår indkøbet skal foretages
  createdAt: string;
  createdBy: string;
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

// Meal plan override (calorie diary tracking)
export interface MealPlanOverride {
  id: string;
  mealPlanId: string;
  memberId: string;
  date: string;
  action: 'accepted' | 'rejected' | 'replaced';
  replacementFood?: string;
  replacementKcal?: number;
  replacementProtein?: number;
  replacementCarbs?: number;
  replacementFat?: number;
  replacedAt: string;
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
  | 'cleaning_reminder'
  | 'group_request_approved';

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

export interface NotificationPreferences {
  // Samvær & Afleveringer
  handoverReminders: boolean;
  handoverReminderMinutes: number;
  scheduleChanges: boolean;
  // Kalender & Datoer
  eventReminders: boolean;
  importantDates: boolean;
  // Opgaver
  taskAssigned: boolean;
  taskDeadline: boolean;
  // Økonomi
  expensePending: boolean;
  expenseUpdates: boolean;
  // Beskeder
  newMessages: boolean;
  professionalMessages: boolean;
  // Hjem & Mad
  mealPlanReminder: boolean;
  shoppingReminder: boolean;
  cleaningReminder: boolean;
  // Dokumenter & Beslutninger
  documentShared: boolean;
  decisionProposed: boolean;
  // Dagbog & Trivsel
  diaryReminder: boolean;
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
  documentIds?: string[];
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

// Fridge history (tracking used/thrown away items)
export interface FridgeHistoryEntry {
  id: string;
  itemName: string;
  reason: 'used' | 'thrown_away';
  removedAt: string;
  removedBy: string;
  addedAt: string;
  expiresAt?: string;
  nutritionPer100g?: FridgeItem['nutritionPer100g'];
  category?: string;
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

// Budget
export interface BudgetGoal {
  category: string;
  monthlyAmount: number;
}

// Wish list
export interface WishItem {
  id: string;
  title: string;
  priceEstimate?: number;
  link?: string;
  imageUrl?: string;
  description?: string;
  childId: string;
  addedBy: string;
  status: 'wanted' | 'bought';
  boughtBy?: string;
  createdAt: string;
}

// Permission types
export type SharePermissionLevel = 'none' | 'busy_only' | 'titles_only' | 'full';

export interface FamilyPermissions {
  canShareCalendar: boolean;
  canLinkCoParent: boolean;
  canRequestSwap: boolean;
  canSeePartnerEvents: boolean;
  calendarSharingDefault: SharePermissionLevel;
  requiresLinkingForSharing: boolean;
  maxShareTargets: number; // 0=ingen, 1=co-parent, -1=ubegrænset
}

// Co-parent linking types
export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  householdId: string;
  expiresAt: string;
  usedBy?: string;
  usedAt?: string;
  status: 'pending' | 'used' | 'expired';
}

export interface CoParentLink {
  id: string;
  householdId: string;
  user1Id: string;
  user2Id: string;
  linkedAt: string;
  status: 'active' | 'revoked';
  inviteCodeId: string;
}

// Calendar sharing grant types
export interface ShareGrant {
  id: string;
  grantorId: string;
  granteeId: string;
  householdId: string;
  createdAt: string;
  status: 'pending' | 'active' | 'revoked';
}

export interface SharePermission {
  id: string;
  shareGrantId: string;
  calendarSourceId: string | null; // null = hovedkalender
  level: SharePermissionLevel;
}

export interface ChildMembership {
  id: string;
  childId: string;
  userId: string;
  role: 'parent' | 'step_parent' | 'guardian';
  householdId: string;
  linkedAt: string;
  status: 'pending' | 'active';
}

// Dashboard quick action type
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  tab: string;
  accent: boolean;
  order: number;
}

// ── Professional case types ──────────────────────────────────
export type CaseStatus = 'active' | 'closed' | 'paused';
export type CasePriority = 'normal' | 'high' | 'urgent';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProfessionalCase {
  id: string;
  caseNumber: string;
  departmentId: string;
  municipality: string;
  familyName: string;
  parents: string[];
  childName: string;
  childAge: number;
  status: CaseStatus;
  priority: CasePriority;
  riskLevel: RiskLevel;
  lastContact: string;
  nextMeeting: string;
  unreadMessages: number;
  pendingApprovals: number;
  notes: string;
  assignedTo: string;
  householdId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Risk assessment types ────────────────────────────────────
export type RiskAssessmentStatus = 'draft' | 'sent' | 'archived';

export interface RiskFactor {
  category: string;
  description: string;
  severity: RiskLevel;
}

export interface RiskAssessment {
  id: string;
  caseId: string;
  assessorId: string;
  assessmentDate: string;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  protectiveFactors: string;
  summary: string;
  recommendations: string;
  status: RiskAssessmentStatus;
  sentTo: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Department types ─────────────────────────────────────────
export interface ProfessionalDepartment {
  id: string;
  municipality: string;
  departmentCode: string;
  departmentName: string;
  region: string;
}

// ── Activity log types ───────────────────────────────────────
export type ActivityType = 'meeting' | 'note' | 'message' | 'document' | 'assessment' | 'status_change';

export interface CaseActivity {
  id: string;
  caseId: string;
  type: ActivityType;
  title: string;
  description: string;
  relatedId?: string;
  relatedType?: string;
  createdBy: string;
  createdAt: string;
}

// App state
export interface AppState {
  currentUser: User | null;
  currentChild: Child | null;
  household: Household | null;
  isLoading: boolean;
  activeTab: string;
}
