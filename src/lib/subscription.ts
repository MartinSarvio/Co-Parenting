import type {
  BillingModel,
  Household,
  HouseholdMode,
  HouseholdSubscription,
  SubscriptionPlan
} from '@/types';

export type SubscriptionFeature =
  | 'multipleChildren'
  | 'shoppingScanner'
  | 'expenses'
  | 'inAppPayments'
  | 'recurringExpenses'
  | 'singleParentEvidence'
  | 'lawyerAccess'
  | 'familyMembers'
  | 'calendarSharing'
  | 'unlimitedCategories';

export interface PlanFeatures {
  maxChildren: number;
  multipleChildren: boolean;
  shoppingScanner: boolean;
  expenses: boolean;
  inAppPayments: boolean;
  recurringExpenses: boolean;
  singleParentEvidence: boolean;
  lawyerAccess: boolean;
  familyMembers: boolean;
  maxFamilyMembers: number;
  calendarSharing: boolean;
  unlimitedCategories: boolean;
}

const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    maxChildren: 1,
    multipleChildren: false,
    shoppingScanner: false,
    expenses: true,
    inAppPayments: false,
    recurringExpenses: false,
    singleParentEvidence: false,
    lawyerAccess: false,
    familyMembers: false,
    maxFamilyMembers: 0,
    calendarSharing: false,
    unlimitedCategories: false,
  },
  family_plus: {
    maxChildren: 8,
    multipleChildren: true,
    shoppingScanner: true,
    expenses: true,
    inAppPayments: true,
    recurringExpenses: true,
    singleParentEvidence: false,
    lawyerAccess: false,
    familyMembers: true,
    maxFamilyMembers: 6,
    calendarSharing: true,
    unlimitedCategories: true,
  },
  single_parent_plus: {
    maxChildren: 8,
    multipleChildren: true,
    shoppingScanner: true,
    expenses: true,
    inAppPayments: true,
    recurringExpenses: true,
    singleParentEvidence: true,
    lawyerAccess: true,
    familyMembers: true,
    maxFamilyMembers: 8,
    calendarSharing: true,
    unlimitedCategories: true,
  }
};

export function getDefaultBillingModel(familyMode?: HouseholdMode): BillingModel {
  return familyMode === 'together' ? 'shared' : 'separate';
}

export function getDefaultPlan(familyMode?: HouseholdMode): SubscriptionPlan {
  if (familyMode === 'single_parent') return 'single_parent_plus';
  return 'free';
}

export function getSubscriptionPlan(household: Household | null | undefined): SubscriptionPlan {
  if (!household?.subscription) {
    return getDefaultPlan(household?.familyMode);
  }
  return household.subscription.plan;
}

export function getPlanFeatures(household: Household | null | undefined): PlanFeatures {
  return PLAN_FEATURES[getSubscriptionPlan(household)];
}

export function hasSubscriptionFeature(
  household: Household | null | undefined,
  feature: SubscriptionFeature
): boolean {
  return getPlanFeatures(household)[feature];
}

export function getMaxChildren(household: Household | null | undefined): number {
  return getPlanFeatures(household).maxChildren;
}

export function normalizeSubscription(
  household: Household | null | undefined
): HouseholdSubscription {
  const familyMode = household?.familyMode;
  const existing = household?.subscription;
  return {
    plan: existing?.plan || getDefaultPlan(familyMode),
    billingModel: existing?.billingModel || getDefaultBillingModel(familyMode),
    status: existing?.status || 'active',
    startedAt: existing?.startedAt || new Date().toISOString(),
    payerUserId: existing?.payerUserId
  };
}

export function isSharedSubscription(household: Household | null | undefined): boolean {
  return normalizeSubscription(household).billingModel === 'shared';
}
