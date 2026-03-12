import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { getPermissionsForMode } from '@/lib/permissions';
import type { FamilyPermissions } from '@/types';

const DEFAULT_PERMISSIONS: FamilyPermissions = {
  canShareCalendar: false,
  canLinkCoParent: false,
  canRequestSwap: false,
  canSeePartnerEvents: false,
  calendarSharingDefault: 'none',
  requiresLinkingForSharing: false,
  maxShareTargets: 0,
};

export function usePermissions() {
  const household = useAppStore((s) => s.household);
  const coParentLink = useAppStore((s) => s.coParentLink);

  const permissions = useMemo(() => {
    if (!household?.familyMode) return DEFAULT_PERMISSIONS;
    return getPermissionsForMode(household.familyMode);
  }, [household?.familyMode]);

  const isLinked = coParentLink?.status === 'active';

  const canShareCalendar =
    permissions.canShareCalendar &&
    (isLinked || !permissions.requiresLinkingForSharing);

  return {
    permissions,
    isLinked,
    canShareCalendar,
  };
}
