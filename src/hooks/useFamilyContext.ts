import { useAppStore } from '@/store';
import type { Child, CustodyPlan, User } from '@/types';

export interface FamilyContext {
  currentChild: Child | null;
  custodyPlan: CustodyPlan | null;
  otherParent: User | null;
  parents: User[];
}

/**
 * Null-safe hook that resolves the currently selected child, their custody plan,
 * and the other parent. Replaces the unsafe `children[0]` / `custodyPlans[0]` pattern.
 */
export function useFamilyContext(): FamilyContext {
  const { currentUser, users, children, custodyPlans, currentChildId } = useAppStore();

  const currentChild: Child | null =
    (currentChildId ? children.find((c) => c.id === currentChildId) : null) ??
    children[0] ??
    null;

  const custodyPlan: CustodyPlan | null = currentChild
    ? (custodyPlans.find((p) => p.childId === currentChild.id) ?? null)
    : null;

  const parents = users.filter((u) => u.role === 'parent');

  const otherParent: User | null =
    parents.find((u) => u.id !== currentUser?.id) ?? null;

  return { currentChild, custodyPlan, otherParent, parents };
}
