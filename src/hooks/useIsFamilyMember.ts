import { useAppStore } from '@/store';

export function useIsFamilyMember() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isFamilyMemberView = useAppStore((s) => s.isFamilyMemberView);

  // True if actual family_member OR admin simulating family member view
  const isFamilyMember = currentUser?.role === 'family_member' || (isFamilyMemberView && currentUser?.isAdmin === true);

  return {
    isFamilyMember,
    isSimulated: isFamilyMemberView && currentUser?.isAdmin === true,
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
