/**
 * Data Sync — henter alt data fra Supabase og sætter det i Zustand store.
 *
 * Bruges ved login og session restore for at fylde store med server-data.
 * RLS (Row Level Security) sørger for at brugeren kun ser sin egen data.
 */

import { supabase } from './supabase';
import {
  mapChild,
  mapHousehold,
  extractUsersFromMembers,
  mapEvent,
  mapTask,
  mapExpense,
  mapDocument,
  mapMealPlan,
  mapThread,
  mapDecisionLog,
  mapKeyDate,
  mapDiaryEntry,
  mapMilestone,
  mapShoppingItem,
  mapShoppingList,
  mapUserRecipe,
  mapProfessionalCase,
  mapRiskAssessment,
  mapProfessionalDepartment,
  mapCaseActivity,
} from './mappers';
import type {
  DbChild,
  DbHouseholdMember,
  DbCalendarEvent,
  DbTask,
  DbExpense,
  DbDocument,
  DbMealPlan,
  DbThread,
  DbDecisionLog,
  DbKeyDate,
  DbDiaryEntry,
  DbMilestone,
  DbShoppingItem,
  DbShoppingList,
  DbUserRecipe,
  DbProfessionalCase,
  DbRiskAssessment,
  DbProfessionalDepartment,
  DbCaseActivity,
} from './mappers';
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
  DecisionLog,
  KeyDate,
  DiaryEntry,
  Milestone,
  ShoppingItem,
  ShoppingList,
  Recipe,
  ProfessionalCase,
  RiskAssessment,
  ProfessionalDepartment,
  CaseActivity,
  RoutineItem,
  RoutineLog,
  FridgeItem,
  CustodyPlan,
  BudgetGoal,
  WishItem,
  FamilyPhoto,
  NotificationPreferences,
} from '@/types';

export interface InitialData {
  users: User[];
  household: Household | null;
  children?: Child[];
  events: CalendarEvent[];
  tasks: Task[];
  expenses: Expense[];
  documents: Document[];
  mealPlans: MealPlan[];
  threads: MessageThread[];
  decisions: DecisionLog[];
  keyDates: KeyDate[];
  diaryEntries: DiaryEntry[];
  milestones: Milestone[];
  shoppingItems: ShoppingItem[];
  shoppingLists: ShoppingList[];
  userRecipes: Recipe[];
  professionalCases: ProfessionalCase[];
  riskAssessments: RiskAssessment[];
  departments: ProfessionalDepartment[];
  caseActivities: CaseActivity[];
  routineItems: RoutineItem[];
  routineLogs: RoutineLog[];
  fridgeItems: FridgeItem[];
  custodyPlans: CustodyPlan[];
  budgetGoals: BudgetGoal[];
  wishItems: WishItem[];
  photos: FamilyPhoto[];
  notificationPreferences: NotificationPreferences | null;
}

/**
 * Henter alt data parallelt fra Supabase og returnerer mapped data.
 * RLS sørger automatisk for at filtrere til brugerens husstand.
 */
export async function loadInitialData(): Promise<InitialData> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Ikke logget ind');

  const userId = authUser.id;

  // Hent household membership
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId);

  let household: Household | null = null;
  let users: User[] = [];

  if (memberships && memberships.length > 0) {
    const householdId = memberships[0].household_id;

    // Hent household + medlemmer med profiler
    const [householdResult, membersResult, childrenInHousehold] = await Promise.all([
      supabase.from('households').select('*').eq('id', householdId).single(),
      supabase.from('household_members').select('*, user:profiles(*)').eq('household_id', householdId),
      supabase.from('children').select('*').eq('household_id', householdId),
    ]);

    if (householdResult.data) {
      const members = (membersResult.data || []) as unknown as DbHouseholdMember[];
      const hChildren = (childrenInHousehold.data || []) as unknown as DbChild[];
      household = mapHousehold(householdResult.data, members, hChildren);
      users = extractUsersFromMembers(members);
    }
  }

  // Hent resten parallelt — RLS filtrerer automatisk
  // Pagination: Begræns tunge tabeller for hurtigere initial load
  const MAX_EVENTS = 500;
  const MAX_EXPENSES = 300;
  const MAX_THREADS = 50;
  const MAX_DIARY = 200;

  const [
    childrenResult,
    eventsResult,
    tasksResult,
    expensesResult,
    documentsResult,
    mealPlansResult,
    threadsResult,
    decisionsResult,
    keyDatesResult,
    diaryResult,
    milestonesResult,
    shoppingItemsResult,
    shoppingListsResult,
    userRecipesResult,
    professionalCasesResult,
    riskAssessmentsResult,
    departmentsResult,
    caseActivitiesResult,
    routineItemsResult,
    routineLogsResult,
    fridgeItemsResult,
    custodyPlansResult,
    budgetGoalsResult,
    wishItemsResult,
    photosResult,
    notifPrefsResult,
  ] = await Promise.all([
    supabase.from('children').select('*').then(r => r.data as DbChild[] | null, () => null),
    supabase.from('calendar_events').select('*').order('start_date', { ascending: false }).limit(MAX_EVENTS).then(r => (r.data || []) as DbCalendarEvent[], () => [] as DbCalendarEvent[]),
    supabase.from('tasks').select('*').then(r => (r.data || []) as DbTask[], () => [] as DbTask[]),
    supabase.from('expenses').select('*').order('date', { ascending: false }).limit(MAX_EXPENSES).then(r => (r.data || []) as DbExpense[], () => [] as DbExpense[]),
    supabase.from('documents').select('*').then(r => (r.data || []) as DbDocument[], () => [] as DbDocument[]),
    supabase.from('meal_plans').select('*').then(r => (r.data || []) as DbMealPlan[], () => [] as DbMealPlan[]),
    supabase.from('message_threads').select('*, messages(id, content, sender_id, created_at, read_by)').order('updated_at', { ascending: false }).limit(MAX_THREADS).then(r => (r.data || []) as unknown as DbThread[], () => [] as DbThread[]),
    supabase.from('decision_logs').select('*').then(r => (r.data || []) as DbDecisionLog[], () => [] as DbDecisionLog[]),
    supabase.from('key_dates').select('*').then(r => (r.data || []) as DbKeyDate[], () => [] as DbKeyDate[]),
    supabase.from('diary_entries').select('*').order('date', { ascending: false }).limit(MAX_DIARY).then(r => (r.data || []) as DbDiaryEntry[], () => [] as DbDiaryEntry[]),
    supabase.from('milestones').select('*').then(r => (r.data || []) as DbMilestone[], () => [] as DbMilestone[]),
    supabase.from('shopping_items').select('*').then(r => (r.data || []) as DbShoppingItem[], () => [] as DbShoppingItem[]),
    supabase.from('shopping_lists').select('*').then(r => (r.data || []) as DbShoppingList[], () => [] as DbShoppingList[]),
    supabase.from('user_recipes').select('*').then(r => (r.data || []) as DbUserRecipe[], () => [] as DbUserRecipe[]),
    supabase.from('professional_cases').select('*').then(r => (r.data || []) as DbProfessionalCase[], () => [] as DbProfessionalCase[]),
    supabase.from('risk_assessments').select('*').then(r => (r.data || []) as DbRiskAssessment[], () => [] as DbRiskAssessment[]),
    supabase.from('professional_departments').select('*').then(r => (r.data || []) as DbProfessionalDepartment[], () => [] as DbProfessionalDepartment[]),
    supabase.from('case_activity_log').select('*').order('created_at', { ascending: false }).limit(200).then(r => (r.data || []) as DbCaseActivity[], () => [] as DbCaseActivity[]),
    supabase.from('routine_items').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('routine_logs').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('fridge_items').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('custody_plans').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('budget_goals').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('wish_items').select('*').then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('family_photos').select('*').order('taken_at', { ascending: false }).limit(200).then(r => (r.data || []) as any[], () => [] as any[]),
    supabase.from('notification_preferences').select('*').eq('user_id', userId).single().then(r => r.data as any | null, () => null),
  ]);

  return {
    users,
    household,
    children: childrenResult !== null ? childrenResult.map(mapChild) : undefined,
    events: eventsResult.map(mapEvent),
    tasks: tasksResult.map(mapTask),
    expenses: expensesResult.map(mapExpense),
    documents: documentsResult.map(mapDocument),
    mealPlans: mealPlansResult.map(mapMealPlan),
    threads: threadsResult.map(mapThread),
    decisions: decisionsResult.map(mapDecisionLog),
    keyDates: keyDatesResult.map(mapKeyDate),
    diaryEntries: diaryResult.map(mapDiaryEntry),
    milestones: milestonesResult.map(mapMilestone),
    shoppingItems: shoppingItemsResult.map(mapShoppingItem),
    shoppingLists: shoppingListsResult.map(mapShoppingList),
    userRecipes: userRecipesResult.map(mapUserRecipe),
    professionalCases: professionalCasesResult.map(mapProfessionalCase),
    riskAssessments: riskAssessmentsResult.map(mapRiskAssessment),
    departments: departmentsResult.map(mapProfessionalDepartment),
    caseActivities: caseActivitiesResult.map(mapCaseActivity),
    routineItems: routineItemsResult.map((r: any): RoutineItem => ({
      id: r.id,
      childId: r.child_id,
      category: r.category,
      type: r.type,
      label: r.label,
      emoji: r.emoji,
      order: r.order,
      mealKey: r.meal_key ?? undefined,
      isActive: r.is_active ?? true,
      createdBy: r.created_by,
      createdAt: r.created_at ?? '',
    })),
    routineLogs: routineLogsResult.map((r: any): RoutineLog => ({
      id: r.id,
      routineItemId: r.routine_item_id,
      childId: r.child_id,
      date: r.date,
      completed: r.completed ?? false,
      completedAt: r.completed_at ?? undefined,
      completedBy: r.completed_by ?? undefined,
      time: r.time ?? undefined,
      note: r.note ?? undefined,
      linkedFoodLogId: r.linked_food_log_id ?? undefined,
    })),
    fridgeItems: fridgeItemsResult.map((r: any): FridgeItem => ({
      id: r.id,
      name: r.name,
      barcode: r.barcode ?? undefined,
      addedAt: r.added_at ?? '',
      addedBy: r.added_by ?? '',
      expiresAt: r.expires_at ?? undefined,
      nutritionPer100g: r.nutrition_per_100g ?? undefined,
      allergens: r.allergens ?? undefined,
    })),
    custodyPlans: custodyPlansResult.map((r: any): CustodyPlan => ({
      id: r.id,
      childId: r.child_id,
      name: r.name,
      pattern: r.pattern,
      startDate: r.start_date ?? '',
      swapDay: r.swap_day ?? 0,
      swapTime: r.swap_time ?? '18:00',
      swapLocation: r.swap_location ?? undefined,
      parent1Weeks: r.parent1_weeks ?? undefined,
      parent2Weeks: r.parent2_weeks ?? undefined,
      parent1Days: r.parent1_days ?? [],
      parent2Days: r.parent2_days ?? [],
      weeklySchedule: r.weekly_schedule ?? undefined,
      customWeekConfig: r.custom_week_config ?? undefined,
      customSchedule: r.custom_schedule ?? undefined,
      supervisedConfig: r.supervised_config ?? undefined,
      holidays: r.holidays ?? undefined,
      specialDays: r.special_days ?? undefined,
    })),
    budgetGoals: budgetGoalsResult.map((r: any): BudgetGoal => ({
      category: r.category,
      monthlyAmount: r.monthly_amount ?? 0,
    })),
    wishItems: wishItemsResult.map((r: any): WishItem => ({
      id: r.id,
      title: r.title,
      priceEstimate: r.price_estimate ?? undefined,
      link: r.link ?? undefined,
      imageUrl: r.image_url ?? undefined,
      description: r.description ?? undefined,
      childId: r.child_id,
      addedBy: r.added_by,
      status: r.status ?? 'wanted',
      boughtBy: r.bought_by ?? undefined,
      createdAt: r.created_at ?? '',
    })),
    photos: photosResult.map((r: any): FamilyPhoto => ({
      id: r.id,
      childId: r.child_id,
      url: r.url,
      caption: r.caption ?? undefined,
      takenAt: r.taken_at ?? '',
      addedBy: r.added_by,
      addedAt: r.added_at ?? '',
    })),
    notificationPreferences: notifPrefsResult ? {
      handoverReminders: notifPrefsResult.handover_reminders ?? true,
      handoverReminderMinutes: notifPrefsResult.handover_reminder_minutes ?? 30,
      scheduleChanges: notifPrefsResult.schedule_changes ?? true,
      eventReminders: notifPrefsResult.event_reminders ?? true,
      importantDates: notifPrefsResult.important_dates ?? true,
      taskAssigned: notifPrefsResult.task_assigned ?? true,
      taskDeadline: notifPrefsResult.task_deadline ?? true,
      expensePending: notifPrefsResult.expense_pending ?? true,
      expenseUpdates: notifPrefsResult.expense_updates ?? true,
      newMessages: notifPrefsResult.new_messages ?? true,
      professionalMessages: notifPrefsResult.professional_messages ?? true,
      mealPlanReminder: notifPrefsResult.meal_plan_reminder ?? true,
      shoppingReminder: notifPrefsResult.shopping_reminder ?? true,
      cleaningReminder: notifPrefsResult.cleaning_reminder ?? true,
      documentShared: notifPrefsResult.document_shared ?? true,
      decisionProposed: notifPrefsResult.decision_proposed ?? true,
      diaryReminder: notifPrefsResult.diary_reminder ?? true,
    } : null,
  };
}
