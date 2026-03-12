import type { HouseholdMode, FamilyPermissions, SharePermissionLevel } from '@/types';

const PERMISSIONS_BY_MODE: Record<HouseholdMode, FamilyPermissions> = {
  co_parenting: {
    canShareCalendar: true,
    canLinkCoParent: true,
    canRequestSwap: true,
    canSeePartnerEvents: false,
    calendarSharingDefault: 'none',
    requiresLinkingForSharing: true,
    maxShareTargets: 1,
  },
  together: {
    canShareCalendar: true,
    canLinkCoParent: false,
    canRequestSwap: false,
    canSeePartnerEvents: true,
    calendarSharingDefault: 'full',
    requiresLinkingForSharing: false,
    maxShareTargets: -1,
  },
  blended: {
    canShareCalendar: true,
    canLinkCoParent: true,
    canRequestSwap: true,
    canSeePartnerEvents: false,
    calendarSharingDefault: 'none',
    requiresLinkingForSharing: true,
    maxShareTargets: -1,
  },
  single_parent: {
    canShareCalendar: false,
    canLinkCoParent: false,
    canRequestSwap: false,
    canSeePartnerEvents: false,
    calendarSharingDefault: 'none',
    requiresLinkingForSharing: false,
    maxShareTargets: 0,
  },
};

export function getPermissionsForMode(mode: HouseholdMode): FamilyPermissions {
  return PERMISSIONS_BY_MODE[mode];
}

export function canShare(mode: HouseholdMode, feature: 'calendar' | 'swap'): boolean {
  const perms = PERMISSIONS_BY_MODE[mode];
  if (feature === 'calendar') return perms.canShareCalendar;
  if (feature === 'swap') return perms.canRequestSwap;
  return false;
}

export function getDefaultSharingLevel(mode: HouseholdMode): SharePermissionLevel {
  return PERMISSIONS_BY_MODE[mode].calendarSharingDefault;
}
