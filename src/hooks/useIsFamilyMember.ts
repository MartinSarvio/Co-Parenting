import { useAppStore } from '@/store';

export function useIsFamilyMember() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isFamilyMember = currentUser?.role === 'family_member';

  return {
    isFamilyMember,
    familyMemberRole: currentUser?.familyMemberRole ?? null,
    canRequestSwap: !isFamilyMember,
    canViewExpenses: !isFamilyMember,
    canViewChat: !isFamilyMember,
    canViewHandover: !isFamilyMember,
    canViewFeed: !isFamilyMember,
    canViewTasks: !isFamilyMember,
    canViewMadHjem: !isFamilyMember,
  };
}
