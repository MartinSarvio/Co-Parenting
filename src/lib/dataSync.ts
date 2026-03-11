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
  };
}
