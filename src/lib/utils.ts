import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, addDays, parseISO, startOfWeek, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date, formatStr: string = 'dd. MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: da });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: da });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd. MMMM yyyy kl. HH:mm', { locale: da });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const days = differenceInDays(d, now);
  
  if (days === 0) return 'I dag';
  if (days === 1) return 'I morgen';
  if (days === -1) return 'I går';
  if (days > 1 && days < 7) return `Om ${days} dage`;
  if (days < -1 && days > -7) return `For ${Math.abs(days)} dage siden`;
  
  return formatDate(date);
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd. MMM', { locale: da });
}

// Weekday names
export const weekdayNames = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn'];
export const weekdayNamesFull = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

// Custody plan utilities
export function getCurrentParentForChild(
  _childId: string,
  custodyPlan: {
    pattern: string;
    startDate: string;
    parent1Days: number[];
    parent2Days: number[];
    customWeekConfig?: {
      evenWeekAssignments: string[];
      oddWeekAssignments: string[];
    };
  },
  parent1Id: string,
  parent2Id: string,
  date: Date = new Date()
): string {
  const startDate = parseISO(custodyPlan.startDate);
  const daysSinceStart = differenceInDays(date, startDate);
  
  if (custodyPlan.pattern === '7/7') {
    const weekNumber = Math.floor(daysSinceStart / 7);
    return weekNumber % 2 === 0 ? parent1Id : parent2Id;
  }
  
  if (custodyPlan.pattern === '10/4') {
    const dayInCycle = daysSinceStart % 14;
    return dayInCycle < 10 ? parent1Id : parent2Id;
  }

  const dayOfWeek = date.getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday

  if (custodyPlan.pattern === 'custom' && custodyPlan.customWeekConfig) {
    const weekNo = getISOWeek(date);
    const isEvenWeek = weekNo % 2 === 0;
    const assignments = isEvenWeek
      ? custodyPlan.customWeekConfig.evenWeekAssignments
      : custodyPlan.customWeekConfig.oddWeekAssignments;

    const assignedParentId = assignments?.[adjustedDay];
    if (assignedParentId === parent1Id || assignedParentId === parent2Id) {
      return assignedParentId;
    }
  }
  
  // Default: check parent1Days (day of week)
  if (custodyPlan.parent1Days.includes(adjustedDay)) {
    return parent1Id;
  }
  return parent2Id;
}

export function getNextHandoverDate(
  custodyPlan: {
    pattern: string;
    startDate: string;
    swapTime?: string;
    customWeekConfig?: {
      handoverDays: number[];
      handoverTime: string;
    };
  },
  fromDate: Date = new Date()
): Date {
  const startDate = parseISO(custodyPlan.startDate);
  const daysSinceStart = differenceInDays(fromDate, startDate);
  
  if (custodyPlan.pattern === '7/7') {
    const daysUntilNext = 7 - (daysSinceStart % 7);
    return addDays(fromDate, daysUntilNext);
  }
  
  if (custodyPlan.pattern === '10/4') {
    const dayInCycle = daysSinceStart % 14;
    let daysUntilNext: number;
    if (dayInCycle < 10) {
      daysUntilNext = 10 - dayInCycle;
    } else {
      daysUntilNext = 14 - dayInCycle;
    }
    return addDays(fromDate, daysUntilNext);
  }

  if (custodyPlan.pattern === 'custom' && custodyPlan.customWeekConfig?.handoverDays?.length) {
    const [hoursStr, minutesStr] = (custodyPlan.customWeekConfig.handoverTime || custodyPlan.swapTime || '16:00').split(':');
    const targetHours = Number(hoursStr) || 16;
    const targetMinutes = Number(minutesStr) || 0;

    for (let offset = 0; offset < 14; offset += 1) {
      const candidate = addDays(fromDate, offset);
      const dayOfWeek = candidate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (!custodyPlan.customWeekConfig.handoverDays.includes(adjustedDay)) {
        continue;
      }

      const candidateWithTime = new Date(candidate);
      candidateWithTime.setHours(targetHours, targetMinutes, 0, 0);

      if (candidateWithTime <= fromDate) {
        continue;
      }

      return candidateWithTime;
    }
  }
  
  return addDays(fromDate, 7);
}

// Calendar utilities
export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Color utilities
export function getParentColor(color: 'warm' | 'cool' | 'neutral'): string {
  if (color === 'warm') return '#F58A2D';
  if (color === 'cool') return '#2F2F2F';
  return '#8A8679';
}

export function getParentColorClass(color: 'warm' | 'cool' | 'neutral'): string {
  if (color === 'warm') return 'text-[#f58a2d] bg-[#fff2e6] border-[#f3c59d]';
  if (color === 'cool') return 'text-[#2f2f2f] bg-[#eceae2] border-[#d2d1c8]';
  return 'text-[#6c695f] bg-[#f2f1ec] border-[#d8d7cf]';
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    school: 'bg-[#2f2f2f]',
    activity: 'bg-[#8b8677]',
    work: 'bg-[#5e5a50]',
    personal: 'bg-[#f58a2d]',
    handover: 'bg-[#f58a2d]',
    appointment: 'bg-[#2f2f2f]',
    institution: 'bg-[#c6a98a]',
    meeting: 'bg-[#8b8677]'
  };
  return colors[type] || 'bg-gray-500';
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    school: 'Skole',
    activity: 'Aktivitet',
    work: 'Arbejde',
    personal: 'Personlig',
    handover: 'Aflevering',
    appointment: 'Aftale',
    institution: 'Institution',
    meeting: 'Møde'
  };
  return labels[type] || type;
}

// Task utilities
export function getTaskCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: 'Generel',
    shopping: 'Indkøb',
    child: 'Barn',
    handover: 'Aflevering',
    meeting: 'Møde',
    expense: 'Udgift',
    cleaning: 'Rengøring'
  };
  return labels[category] || category;
}

export function getMealTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Morgenmad',
    lunch: 'Frokost',
    dinner: 'Aftensmad',
    snack: 'Snack'
  };
  return labels[type] || type;
}

// Document type utilities
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    contract: 'Kontrakt',
    medical: 'Medicinsk',
    school: 'Skole',
    insurance: 'Forsikring',
    other: 'Andet',
    meeting_minutes: 'Mødereferat',
    court_order: 'Rettskendelse',
    custody_agreement: 'Samværsaftale',
    authority_document: 'Myndighedsdokument'
  };
  return labels[type] || type;
}

// Expense category utilities
export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    institution: 'Institution',
    medical: 'Medicin/Sundhed',
    clothing: 'Tøj',
    activities: 'Aktiviteter',
    school: 'Skole',
    food: 'Mad',
    transport: 'Transport',
    other: 'Andet'
  };
  return labels[category] || category;
}

// Milestone category utilities
export function getMilestoneCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    health: 'Sundhed',
    school: 'Skole',
    development: 'Udvikling',
    social: 'Social'
  };
  return labels[category] || category;
}

// Institution type utilities
export function getInstitutionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    daycare: 'Vuggestue',
    school: 'Skole',
    after_school: 'Fritidsordning',
    other: 'Andet'
  };
  return labels[type] || type;
}

// Notification utilities
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    handover_reminder: 'Switch',
    task_due: 'CheckCircle',
    event_reminder: 'Calendar',
    message: 'MessageCircle',
    expense_pending: 'Receipt',
    schedule_change: 'CalendarClock',
    expense_approved: 'CheckCircle',
    expense_disputed: 'AlertCircle',
    document_shared: 'FileText',
    meal_plan: 'UtensilsCrossed',
    shopping_reminder: 'ShoppingCart',
    cleaning_reminder: 'Home'
  };
  return icons[type] || 'Bell';
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[\d+\-\s()]{8,}$/.test(phone);
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Time utilities
export function getTimeUntil(date: string | Date): { hours: number; minutes: number } {
  const target = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours: diffHours, minutes: diffMinutes };
}

export function formatDuration(hours: number, minutes: number): string {
  if (hours > 0) {
    return `${hours} time${hours !== 1 ? 'r' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
  }
  return `${minutes} minutter`;
}

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'DKK'): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Calculate expense balance between users
export function calculateExpenseBalance(
  expenses: { paidBy: string; splitAmounts: Record<string, number>; status: string }[],
  userIds: string[]
): Record<string, number> {
  const balance: Record<string, number> = {};
  
  userIds.forEach(id => balance[id] = 0);
  
  expenses.filter(e => e.status !== 'disputed').forEach(expense => {
    // Add what the payer paid
    const totalAmount = Object.values(expense.splitAmounts).reduce((a, b) => a + b, 0);
    balance[expense.paidBy] += totalAmount;
    
    // Subtract what each person owes
    Object.entries(expense.splitAmounts).forEach(([userId, amount]) => {
      balance[userId] -= amount;
    });
  });
  
  return balance;
}
