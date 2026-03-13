import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Save,
  Plus,
  Sun,
  Gift,
  MapPin,
  Clock,
  ShieldAlert,
  Repeat,
  Sliders,
  ChevronLeft,
  X,
  Cake,
  Star,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import { notificationId } from '@/lib/id';
import type { CustodyPattern, CustodyPlan, HolidayArrangement, SpecialDay } from '@/types';

const DANISH_HOLIDAYS: { name: string; monthDay: string; endMonthDay?: string; type: 'fixed' | 'period' }[] = [
  { name: 'Nytårsdag', monthDay: '01-01', type: 'fixed' },
  { name: 'Vinterferie', monthDay: '02-10', endMonthDay: '02-16', type: 'period' },
  { name: 'Påskeferie', monthDay: '03-24', endMonthDay: '04-01', type: 'period' },
  { name: 'Skærtorsdag', monthDay: '03-28', type: 'fixed' },
  { name: 'Langfredag', monthDay: '03-29', type: 'fixed' },
  { name: 'Påskedag', monthDay: '03-31', type: 'fixed' },
  { name: '2. påskedag', monthDay: '04-01', type: 'fixed' },
  { name: 'Kristi himmelfartsdag', monthDay: '05-09', type: 'fixed' },
  { name: 'Pinsedag', monthDay: '05-19', type: 'fixed' },
  { name: '2. pinsedag', monthDay: '05-20', type: 'fixed' },
  { name: 'Grundlovsdag', monthDay: '06-05', type: 'fixed' },
  { name: 'Sommerferie', monthDay: '06-28', endMonthDay: '08-10', type: 'period' },
  { name: 'Efterårsferie', monthDay: '10-13', endMonthDay: '10-19', type: 'period' },
  { name: 'Juleaften', monthDay: '12-24', type: 'fixed' },
  { name: '1. juledag', monthDay: '12-25', type: 'fixed' },
  { name: '2. juledag', monthDay: '12-26', type: 'fixed' },
  { name: 'Nytårsaften', monthDay: '12-31', type: 'fixed' },
  { name: 'Juleferie', monthDay: '12-23', endMonthDay: '01-02', type: 'period' },
];

const swapDays = [
  { value: 0, label: 'Mandag' },
  { value: 1, label: 'Tirsdag' },
  { value: 2, label: 'Onsdag' },
  { value: 3, label: 'Torsdag' },
  { value: 4, label: 'Fredag' },
  { value: 5, label: 'Lørdag' },
  { value: 6, label: 'Søndag' },
];

const patternOptions: { value: string; label: string; subtitle: string; icon: LucideIcon; preview: boolean[] }[] = [
  { value: '7/7',               label: '7 / 7',           subtitle: 'En uge hos hver',           icon: Calendar,    preview: [true,true,true,true,true,true,true] },
  { value: '10/4',              label: '10 / 4',          subtitle: '10 dage / 4 dage',          icon: Calendar,    preview: [true,true,true,true,true,false,false] },
  { value: '14/0',              label: '14 / 0',          subtitle: 'Fuld tid hos én forælder',   icon: Calendar,    preview: [true,true,true,true,true,true,true] },
  { value: 'weekday-weekend',   label: 'Hverdag / Wknd',  subtitle: 'Hverdage + weekend delt',   icon: Clock,       preview: [true,true,true,true,true,false,false] },
  { value: 'alternating',       label: 'Alternerende',     subtitle: 'Skift hver anden dag',      icon: Repeat,      preview: [true,false,true,false,true,false,true] },
  { value: 'supervised',        label: 'Overvåget',        subtitle: 'Samvær med opsyn',          icon: ShieldAlert, preview: [true,true,true,true,true,true,false] },
  { value: 'supervised_limited',label: 'Begrænset',        subtitle: 'Få timer, offentligt sted', icon: ShieldAlert, preview: [true,true,true,true,true,true,false] },
  { value: 'custom',            label: 'Tilpasset',        subtitle: 'Definer din egen plan',     icon: Sliders,     preview: [true,true,false,false,true,true,false] },
];

const defaultHandoverDays = [0, 2, 4];

const buildWeekAssignments = (primaryParentId: string, secondaryParentId: string): string[] => {
  const primary = primaryParentId || secondaryParentId;
  const secondary = secondaryParentId || primaryParentId;
  return [primary, primary, secondary, secondary, primary, primary, primary];
};

const normalizeAssignments = (
  assignments: string[] | undefined,
  fallbackAssignments: string[]
): string[] => Array.from({ length: 7 }, (_, day) => assignments?.[day] || fallbackAssignments[day] || '');

function generateWeekAssignments(
  pattern: CustodyPattern,
  p1: string,
  p2: string,
): { even: string[]; odd: string[] } {
  switch (pattern) {
    case '7/7':
      return { even: Array(7).fill(p1), odd: Array(7).fill(p2) };
    case '10/4':
      return { even: Array(7).fill(p1), odd: [p1, p1, p1, p2, p2, p2, p2] };
    case '14/0':
      return { even: Array(7).fill(p1), odd: Array(7).fill(p1) };
    case 'weekday-weekend':
      return { even: [p1, p1, p1, p1, p1, p2, p2], odd: [p1, p1, p1, p1, p1, p2, p2] };
    case 'alternating':
      return { even: [p1, p2, p1, p2, p1, p2, p1], odd: [p2, p1, p2, p1, p2, p1, p2] };
    case 'supervised':
    case 'supervised_limited':
      return { even: Array(7).fill(p1), odd: Array(7).fill(p1) };
    case 'custom':
    default:
      return { even: buildWeekAssignments(p1, p2), odd: buildWeekAssignments(p2, p1) };
  }
}

/* ── Reusable inline components ── */

function WeekAssignmentGrid({
  label,
  assignments,
  onToggle,
  parent1Id,
  parent1Name,
  parent2Name,
  showLegend = true,
  highlightDays,
}: {
  label: string;
  assignments: string[];
  onToggle?: (day: number) => void;
  parent1Id: string;
  parent2Id?: string;
  parent1Name: string;
  parent2Name: string;
  showLegend?: boolean;
  highlightDays?: number[];
}) {
  const readOnly = !onToggle;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {swapDays.map(day => {
          const assignedId = assignments[day.value] || parent1Id;
          const isMe = assignedId === parent1Id;
          const isHighlighted = highlightDays?.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              disabled={readOnly}
              onClick={() => onToggle?.(day.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[8px] border-2 py-2.5 transition-all",
                isHighlighted
                  ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300"
                  : isMe
                    ? "border-primary bg-primary"
                    : "border-orange-tint bg-orange-tint",
                readOnly && "cursor-default"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase",
                isHighlighted ? "text-amber-700" : isMe ? "text-muted-foreground" : "text-[#c87a30]"
              )}>
                {day.label.slice(0, 3)}
              </span>
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                isHighlighted
                  ? "bg-amber-400/30 text-amber-800"
                  : isMe
                    ? "bg-card/20 text-white"
                    : "bg-[#f58a2d]/20 text-[#c87a30]"
              )}>
                {isMe ? parent1Name : parent2Name}
              </div>
            </button>
          );
        })}
      </div>
      {showLegend && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-[11px] text-muted-foreground">{parent1Name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#f58a2d]" />
            <span className="text-[11px] text-muted-foreground">{parent2Name}</span>
          </div>
          {highlightDays && highlightDays.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-[11px] text-muted-foreground">Samværsdag</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParentPicker({
  label,
  selectedParentId,
  parent1Id,
  parent2Id,
  parent1Name,
  parent2Name,
  onChange,
}: {
  label: string;
  selectedParentId: string;
  parent1Id: string;
  parent2Id: string;
  parent1Name: string;
  parent2Name: string;
  onChange: (parentId: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { id: parent1Id, name: parent1Name, isSelf: true },
          { id: parent2Id, name: parent2Name, isSelf: false },
        ].map(parent => {
          const isSel = selectedParentId === parent.id;
          return (
            <button
              key={parent.id}
              type="button"
              onClick={() => onChange(parent.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[12px] border-2 p-3 text-left transition-all",
                isSel
                  ? "border-[#f58a2d] bg-orange-tint-light"
                  : "border-border bg-card hover:border-border"
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                parent.isSelf
                  ? "bg-primary text-white"
                  : "bg-[#f58a2d] text-white"
              )}>
                {parent.name[0]}
              </div>
              <span className={cn(
                "text-[13px] font-semibold",
                isSel ? "text-[#bf6722]" : "text-foreground"
              )}>
                {parent.name}
                {parent.isSelf && <span className="text-[11px] font-normal text-[#9e9b93]"> (Dig)</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function CustodyConfig() {
  const { custodyPlans, household, users, children, updateCustodyPlan, addCustodyPlan, currentUser, setSideMenuOpen } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [addFormType, setAddFormType] = useState<'holiday' | 'special' | null>(null);

  // Add holiday form state
  const [holidayName, setHolidayName] = useState('');
  const [holidayStart, setHolidayStart] = useState('');
  const [holidayEnd, setHolidayEnd] = useState('');
  const [holidayParent, setHolidayParent] = useState('');
  const [holidayAlternate, setHolidayAlternate] = useState(false);

  // Multi-select holiday flow state
  const [holidaySelectOpen, setHolidaySelectOpen] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<Record<string, { parentId: string; alternateYears: boolean }>>({});

  // Add special day form state
  const [specialDescription, setSpecialDescription] = useState('');
  const [specialDate, setSpecialDate] = useState('');
  const [specialType, setSpecialType] = useState<'birthday' | 'holiday' | 'event'>('birthday');
  const [specialParent, setSpecialParent] = useState('');
  const [specialAlternate, setSpecialAlternate] = useState(false);

  const currentChild = children[0];

  const meUser = currentUser;
  const rawOtherParentId = currentChild
    ? (currentChild.parent1Id === currentUser?.id
        ? currentChild.parent2Id
        : currentChild.parent2Id === currentUser?.id
          ? currentChild.parent1Id
          : currentChild.parent2Id)
    : undefined;
  // Guard: hvis "anden forælder" er mig selv, er der ingen rigtig forælder 2
  const otherParentId = rawOtherParentId && rawOtherParentId !== currentUser?.id
    ? rawOtherParentId : undefined;
  const otherUser = otherParentId
    ? users.find(u => u.id === otherParentId)
    : undefined;

  // Brug ALTID barnets parent IDs — de matcher hvad getCurrentParentForChild bruger
  const parent1Id = currentChild?.parent1Id === currentUser?.id
    ? currentChild.parent1Id
    : currentChild?.parent2Id === currentUser?.id
      ? currentChild.parent2Id
      : meUser?.id || 'parent1';
  const rawParent2Id = parent1Id === currentChild?.parent1Id
    ? (currentChild?.parent2Id || '__parent2__')
    : (currentChild?.parent1Id || '__parent2__');
  // KRITISK: parent2Id SKAL altid være forskellig fra parent1Id
  const parent2Id = rawParent2Id !== parent1Id ? rawParent2Id : '__parent2__';
  const defaultEvenWeek = buildWeekAssignments(parent1Id, parent2Id);
  const defaultOddWeek = buildWeekAssignments(parent2Id, parent1Id);

  const parent1Name = meUser?.name?.split(' ')[0] || 'Dig';
  const parent2Name = otherUser?.name?.split(' ')[0] || 'Forælder 2';

  const [config, setConfig] = useState(() => {
    console.log('[CustodyConfig] INIT — custodyPlan:', custodyPlan?.id, 'pattern:', custodyPlan?.pattern, 'custodyPlans.length:', custodyPlans.length);
    const pattern = (custodyPlan?.pattern || '7/7') as CustodyPattern;
    // Prioritér gemte assignments fra store — kun generér friske defaults hvis intet er gemt
    const hasStoredAssignments = custodyPlan?.customWeekConfig?.evenWeekAssignments?.length === 7;
    // Detect corrupted assignments: alle entries er samme ID (pga. gammel parent2Id-bug)
    const storedIds = new Set([
      ...(custodyPlan?.customWeekConfig?.evenWeekAssignments || []),
      ...(custodyPlan?.customWeekConfig?.oddWeekAssignments || []),
    ]);
    const assignmentsCorrupted = hasStoredAssignments && storedIds.size === 1;
    const initialAssignments = (hasStoredAssignments && !assignmentsCorrupted)
      ? { even: custodyPlan!.customWeekConfig!.evenWeekAssignments, odd: custodyPlan!.customWeekConfig!.oddWeekAssignments }
      : generateWeekAssignments(pattern, parent1Id, parent2Id);
    return {
      pattern,
      swapDay: custodyPlan?.swapDay ?? 4,
      swapTime: custodyPlan?.swapTime || '18:00',
      parent1Weeks: custodyPlan?.parent1Weeks || 1,
      parent2Weeks: custodyPlan?.parent2Weeks || 1,
      startDate: custodyPlan?.startDate || new Date().toISOString().slice(0, 10),
      primaryParentId: parent1Id,
      supervisedConfig: custodyPlan?.supervisedConfig || {
        frequencyWeeks: 2,
        durationHours: 3,
        location: '',
        locationType: 'public' as const,
        supervisorRequired: false,
        supervisorName: '',
        specificDays: [5],
        startTime: '10:00',
        notes: '',
      },
      customWeekConfig: {
        handoverDays: custodyPlan?.customWeekConfig?.handoverDays?.length
          ? custodyPlan.customWeekConfig.handoverDays
          : defaultHandoverDays,
        handoverTime: custodyPlan?.customWeekConfig?.handoverTime || custodyPlan?.swapTime || '16:00',
        handoverContext: custodyPlan?.customWeekConfig?.handoverContext || 'after_daycare' as const,
        evenWeekAssignments: normalizeAssignments(
          custodyPlan?.customWeekConfig?.evenWeekAssignments,
          initialAssignments.even
        ),
        oddWeekAssignments: normalizeAssignments(
          custodyPlan?.customWeekConfig?.oddWeekAssignments,
          initialAssignments.odd
        ),
      },
    };
  });

  const handleWeekAssignmentChange = (
    weekType: 'evenWeekAssignments' | 'oddWeekAssignments',
    day: number,
  ) => {
    setConfig(prev => {
      const currentParent = prev.customWeekConfig[weekType][day];
      const newParent = currentParent === parent1Id ? parent2Id : parent1Id;
      const newAssignments = prev.customWeekConfig[weekType].map((pid, i) =>
        i === day ? newParent : pid
      );

      // Auto-sync handoverDays: tilføj dag som skiftedag hvis forgående dag har en anden forælder
      const prevDay = day === 0 ? 6 : day - 1;
      const prevParent = newAssignments[prevDay];
      let newHandoverDays = [...prev.customWeekConfig.handoverDays];
      if (prevParent !== newParent && !newHandoverDays.includes(day)) {
        newHandoverDays.push(day);
      }
      // Fjern dag som skiftedag hvis begge sider nu har samme forælder
      if (prevParent === newParent) {
        newHandoverDays = newHandoverDays.filter(d => d !== day);
      }
      // Tjek også om næste dag skal opdateres
      const nextDay = day === 6 ? 0 : day + 1;
      const nextParent = newAssignments[nextDay];
      if (newParent !== nextParent && !newHandoverDays.includes(nextDay)) {
        newHandoverDays.push(nextDay);
      }
      if (newParent === nextParent) {
        newHandoverDays = newHandoverDays.filter(d => d !== nextDay);
      }

      return {
        ...prev,
        customWeekConfig: {
          ...prev.customWeekConfig,
          [weekType]: newAssignments,
          handoverDays: [...new Set(newHandoverDays)].sort((a, b) => a - b),
        },
      };
    });
  };

  const toggleHandoverDay = (day: number) => {
    setConfig(prev => {
      const exists = prev.customWeekConfig.handoverDays.includes(day);
      const handoverDays = exists
        ? prev.customWeekConfig.handoverDays.filter(d => d !== day)
        : [...prev.customWeekConfig.handoverDays, day].sort((a, b) => a - b);

      // Generer week assignments fra handoverDays
      const assignments: string[] = [];
      let currentParent = prev.primaryParentId || parent1Id;
      for (let d = 0; d < 7; d++) {
        if (handoverDays.includes(d)) {
          currentParent = currentParent === parent1Id ? parent2Id : parent1Id;
        }
        assignments.push(currentParent);
      }

      return {
        ...prev,
        customWeekConfig: {
          ...prev.customWeekConfig,
          handoverDays,
          evenWeekAssignments: assignments,
          oddWeekAssignments: assignments,
        },
      };
    });
  };

  const handlePatternChange = (newPattern: CustodyPattern) => {
    if (config.pattern === newPattern) return;

    const generated = generateWeekAssignments(newPattern, parent1Id, parent2Id);
    setConfig(prev => ({
      ...prev,
      pattern: newPattern,
      primaryParentId: parent1Id,
      parent1Weeks: newPattern === '7/7' ? prev.parent1Weeks : 1,
      parent2Weeks: newPattern === '7/7' ? prev.parent2Weeks : 1,
      customWeekConfig: {
            ...prev.customWeekConfig,
            evenWeekAssignments: generated.even,
            oddWeekAssignments: generated.odd,
          },
    }));
  };

  const handlePrimaryParentChange = (newPrimaryId: string) => {
    const p1 = newPrimaryId;
    const p2 = newPrimaryId === parent1Id ? parent2Id : parent1Id;

    if (config.pattern === 'supervised' || config.pattern === 'supervised_limited') {
      // For supervised: primær har alle dage, besøgende har specificDays
      const supervisedDays = config.supervisedConfig.specificDays || [];
      const newAssignments = Array.from({ length: 7 }, (_, d) =>
        supervisedDays.includes(d) ? p2 : p1
      );
      setConfig(prev => ({
        ...prev,
        primaryParentId: newPrimaryId,
        customWeekConfig: {
          ...prev.customWeekConfig,
          evenWeekAssignments: newAssignments,
          oddWeekAssignments: newAssignments,
        },
      }));
      return;
    }

    const generated = generateWeekAssignments(config.pattern as CustodyPattern, p1, p2);
    setConfig(prev => ({
      ...prev,
      primaryParentId: newPrimaryId,
      customWeekConfig: {
        ...prev.customWeekConfig,
        evenWeekAssignments: generated.even,
        oddWeekAssignments: generated.odd,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[CustodyConfig] SAVE — custodyPlan exists:', !!custodyPlan, 'id:', custodyPlan?.id, 'pattern:', config.pattern);

    const updatedPlan: Partial<CustodyPlan> = {
      pattern: config.pattern as CustodyPattern,
      name: patternOptions.find(p => p.value === config.pattern)?.label || config.pattern,
      swapDay: config.swapDay,
      swapTime: config.swapTime,
    };

    if (['10/4', 'alternating'].includes(config.pattern)) {
      updatedPlan.startDate = config.startDate;
    }

    if (config.pattern === '7/7') {
      updatedPlan.parent1Weeks = config.parent1Weeks;
      updatedPlan.parent2Weeks = config.parent2Weeks;
    }

    if (config.pattern === 'supervised' || config.pattern === 'supervised_limited') {
      updatedPlan.supervisedConfig = config.supervisedConfig;
    }

    if (config.pattern === 'custom') {
      const normalizedHandoverDays = [...new Set(config.customWeekConfig.handoverDays)].sort((a, b) => a - b);
      const handoverDays = normalizedHandoverDays.length ? normalizedHandoverDays : defaultHandoverDays;
      updatedPlan.customWeekConfig = {
        handoverDays,
        handoverTime: config.customWeekConfig.handoverTime || config.swapTime || '16:00',
        handoverContext: config.customWeekConfig.handoverContext,
        evenWeekAssignments: normalizeAssignments(config.customWeekConfig.evenWeekAssignments, defaultEvenWeek),
        oddWeekAssignments: normalizeAssignments(config.customWeekConfig.oddWeekAssignments, defaultOddWeek),
      };
      updatedPlan.swapDay = handoverDays[0];
      updatedPlan.swapTime = config.customWeekConfig.handoverTime || config.swapTime || '16:00';
    } else {
      updatedPlan.customWeekConfig = {
        handoverDays: config.customWeekConfig.handoverDays,
        handoverTime: config.swapTime,
        handoverContext: config.customWeekConfig.handoverContext,
        evenWeekAssignments: normalizeAssignments(config.customWeekConfig.evenWeekAssignments, defaultEvenWeek),
        oddWeekAssignments: normalizeAssignments(config.customWeekConfig.oddWeekAssignments, defaultOddWeek),
      };
    }

    const even = config.customWeekConfig.evenWeekAssignments;
    updatedPlan.parent1Days = even.flatMap((pid, day) => pid === parent1Id ? [day] : []);
    updatedPlan.parent2Days = even.flatMap((pid, day) => pid === parent2Id ? [day] : []);

    if (custodyPlan) {
      updateCustodyPlan(custodyPlan.id, updatedPlan);
      console.log('[CustodyConfig] UPDATED existing plan:', custodyPlan.id);
    } else {
      // Ingen custody plan fundet — opret ny
      const newPlan = {
        id: `cp-${Date.now()}`,
        name: patternOptions.find(p => p.value === config.pattern)?.label || config.pattern,
        childId: currentChild?.id || '',
        startDate: config.startDate || new Date().toISOString().split('T')[0],
        swapDay: config.swapDay,
        swapTime: config.swapTime,
        parent1Days: [],
        parent2Days: [],
        ...updatedPlan,
      } as CustodyPlan;
      addCustodyPlan(newPlan);
      console.log('[CustodyConfig] CREATED new plan:', newPlan.id);
    }

    console.log('[CustodyConfig] Gemt! updatedPlan:', JSON.stringify(updatedPlan, null, 2));

    setIsSaving(false);
    toast.success(`Samværsplan gemt! (${config.pattern})`);
    setSideMenuOpen(false);
  };

  const resetHolidayForm = () => {
    setHolidayName('');
    setHolidayStart('');
    setHolidayEnd('');
    setHolidayParent('');
    setHolidayAlternate(false);
  };

  const resetSpecialForm = () => {
    setSpecialDescription('');
    setSpecialDate('');
    setSpecialType('birthday');
    setSpecialParent('');
    setSpecialAlternate(false);
  };

  const handleAddHoliday = () => {
    if (!holidayName.trim() || !holidayStart || !holidayEnd) {
      toast.error('Udfyld venligst navn og datoer');
      return;
    }
    const newHoliday: HolidayArrangement = {
      id: notificationId(),
      name: holidayName.trim(),
      startDate: holidayStart,
      endDate: holidayEnd,
      parentId: holidayParent || parent1Id,
      alternateYears: holidayAlternate,
    };
    const holidays = [...(custodyPlan?.holidays || []), newHoliday];
    if (custodyPlan) {
      updateCustodyPlan(custodyPlan.id, { holidays });
    }
    toast.success(`${holidayName} tilføjet`);
    resetHolidayForm();
    setAddFormType(null);
  };

  const handleAddSpecialDay = () => {
    if (!specialDescription.trim() || !specialDate) {
      toast.error('Udfyld venligst beskrivelse og dato');
      return;
    }
    const newDay: SpecialDay = {
      id: notificationId(),
      date: specialDate,
      type: specialType,
      description: specialDescription.trim(),
      parentId: specialParent || undefined,
      alternateYears: specialAlternate,
    };
    const specialDays = [...(custodyPlan?.specialDays || []), newDay];
    if (custodyPlan) {
      updateCustodyPlan(custodyPlan.id, { specialDays });
    }
    toast.success(`${specialDescription} tilføjet`);
    resetSpecialForm();
    setAddFormType(null);
  };

  /* ── Multi-select holiday helpers ── */

  const isHolidayAlreadyAssigned = (holidayName: string): boolean => {
    return (custodyPlan?.holidays || []).some(h => h.name === holidayName);
  };

  const getHolidayDates = (holiday: typeof DANISH_HOLIDAYS[number]): { start: string; end: string } => {
    const year = new Date().getFullYear();
    const startDate = `${year}-${holiday.monthDay}`;
    if (holiday.type === 'fixed') {
      return { start: startDate, end: startDate };
    }
    if (holiday.endMonthDay) {
      const endYear = holiday.endMonthDay < holiday.monthDay ? year + 1 : year;
      return { start: startDate, end: `${endYear}-${holiday.endMonthDay}` };
    }
    return { start: startDate, end: startDate };
  };

  const handleAddSelectedHolidays = () => {
    const entries = Object.entries(selectedHolidays);
    if (entries.length === 0) {
      toast.error('Vælg mindst én helligdag');
      return;
    }
    const newHolidays: HolidayArrangement[] = entries.map(([name, cfg]) => {
      const holidayDef = DANISH_HOLIDAYS.find(h => h.name === name)!;
      const dates = getHolidayDates(holidayDef);
      return {
        id: notificationId(),
        name,
        startDate: dates.start,
        endDate: dates.end,
        parentId: cfg.parentId || parent1Id,
        alternateYears: cfg.alternateYears,
      };
    });
    const holidays = [...(custodyPlan?.holidays || []), ...newHolidays];
    if (custodyPlan) {
      updateCustodyPlan(custodyPlan.id, { holidays });
    }
    toast.success(`${newHolidays.length} helligdag${newHolidays.length > 1 ? 'e' : ''} tilføjet`);
    setSelectedHolidays({});
    setHolidaySelectOpen(false);
  };

  /* ── Per-pattern configuration panels ── */

  const renderPatternConfig = () => {
    switch (config.pattern) {
      case '7/7':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skiftedetaljer</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Skiftedag</Label>
                  <SelectSheet
                    value={config.swapDay.toString()}
                    onValueChange={(v) => setConfig({ ...config, swapDay: parseInt(v) })}
                    title="Skiftedag"
                    options={swapDays.map(day => ({ value: day.value.toString(), label: day.label }))}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tidspunkt</Label>
                  <Input
                    type="time"
                    value={config.swapTime}
                    onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
              </div>
            </div>
            <WeekAssignmentGrid
              label="Lige uger"
              assignments={config.customWeekConfig.evenWeekAssignments}
              onToggle={(day) => handleWeekAssignmentChange('evenWeekAssignments', day)}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
            <WeekAssignmentGrid
              label="Ulige uger"
              assignments={config.customWeekConfig.oddWeekAssignments}
              onToggle={(day) => handleWeekAssignmentChange('oddWeekAssignments', day)}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
          </div>
        );

      case '10/4':
        return (
          <div className="space-y-4">
            <ParentPicker
              label="Start hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Startdato</Label>
                <Input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  className="h-10 rounded-[8px] border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Skiftedag</Label>
                  <SelectSheet
                    value={config.swapDay.toString()}
                    onValueChange={(v) => setConfig({ ...config, swapDay: parseInt(v) })}
                    title="Skiftedag"
                    options={swapDays.map(day => ({ value: day.value.toString(), label: day.label }))}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Skift klokken</Label>
                  <Input
                    type="time"
                    value={config.swapTime}
                    onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
              </div>
            </div>
            <WeekAssignmentGrid
              label="Lige uger"
              assignments={config.customWeekConfig.evenWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
            <WeekAssignmentGrid
              label="Ulige uger"
              assignments={config.customWeekConfig.oddWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              showLegend={false}
            />
          </div>
        );

      case '14/0':
        return (
          <div className="space-y-4">
            <ParentPicker
              label="Barnet bor fast hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />
            <WeekAssignmentGrid
              label="Ugeoversigt"
              assignments={config.customWeekConfig.evenWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
          </div>
        );

      case 'weekday-weekend':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skiftedetaljer</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Skiftedag</Label>
                  <SelectSheet
                    value={config.swapDay.toString()}
                    onValueChange={(v) => setConfig({ ...config, swapDay: parseInt(v) })}
                    title="Skiftedag"
                    options={swapDays.map(day => ({ value: day.value.toString(), label: day.label }))}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tidspunkt</Label>
                  <Input
                    type="time"
                    value={config.swapTime}
                    onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                    className="h-10 rounded-[8px] border-border"
                  />
                </div>
              </div>
            </div>
            <WeekAssignmentGrid
              label="Ugeoversigt"
              assignments={config.customWeekConfig.evenWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
          </div>
        );

      case 'alternating':
        return (
          <div className="space-y-4">
            <ParentPicker
              label="Starter hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Startdato</Label>
                <Input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  className="h-10 rounded-[8px] border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dagligt skift klokken</Label>
                <Input
                  type="time"
                  value={config.swapTime}
                  onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                  className="h-10 rounded-[8px] border-border"
                />
              </div>
            </div>
            <ParentPicker
              label="Lige uger starter hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />
            <WeekAssignmentGrid
              label="Lige uger"
              assignments={config.customWeekConfig.evenWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
            <WeekAssignmentGrid
              label="Ulige uger"
              assignments={config.customWeekConfig.oddWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              showLegend={false}
            />
          </div>
        );

      case 'supervised':
      case 'supervised_limited':
        return (
          <div className="space-y-4">
            <ParentPicker
              label="Barnet bor fast hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />
            <div className="space-y-4 rounded-[8px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">
                  {config.pattern === 'supervised' ? 'Overvåget samvær' : 'Begrænset samvær'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Hver X uge</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={config.supervisedConfig.frequencyWeeks || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      supervisedConfig: { ...prev.supervisedConfig, frequencyWeeks: e.target.value === '' ? 0 : parseInt(e.target.value, 10) },
                    }))}
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Antal timer</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={config.supervisedConfig.durationHours || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      supervisedConfig: { ...prev.supervisedConfig, durationHours: e.target.value === '' ? 0 : parseInt(e.target.value, 10) },
                    }))}
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Starttidspunkt</Label>
                <Input
                  type="time"
                  value={config.supervisedConfig.startTime || '10:00'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    supervisedConfig: { ...prev.supervisedConfig, startTime: e.target.value },
                  }))}
                  className="bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Dag(e) for samvær</Label>
                <div className="flex flex-wrap gap-2">
                  {swapDays.map(day => {
                    const isSelected = config.supervisedConfig.specificDays?.includes(day.value);
                    return (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setConfig(prev => {
                          const days = prev.supervisedConfig.specificDays || [];
                          const next = isSelected ? days.filter(d => d !== day.value) : [...days, day.value];
                          const sortedDays = next.sort((a, b) => a - b);
                          // Regenerer assignments: primær har alle dage, besøgende har supervised days
                          const visitingParent = prev.primaryParentId === parent1Id ? parent2Id : parent1Id;
                          const newAssignments = Array.from({ length: 7 }, (_, d) =>
                            sortedDays.includes(d) ? visitingParent : prev.primaryParentId
                          );
                          return {
                            ...prev,
                            supervisedConfig: { ...prev.supervisedConfig, specificDays: sortedDays },
                            customWeekConfig: {
                              ...prev.customWeekConfig,
                              evenWeekAssignments: newAssignments,
                              oddWeekAssignments: newAssignments,
                            },
                          };
                        })}
                        className={isSelected ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-card'}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Sted for samvær
                </Label>
                <SelectSheet
                  value={config.supervisedConfig.locationType}
                  onValueChange={(v) => setConfig(prev => ({
                    ...prev,
                    supervisedConfig: { ...prev.supervisedConfig, locationType: v as 'public' | 'home' | 'institution' | 'other' },
                  }))}
                  title="Sted for samvær"
                  options={[
                    { value: 'public', label: 'Offentligt sted' },
                    { value: 'home', label: 'Hjemme hos forælder' },
                    { value: 'institution', label: 'Institution/familiecenter' },
                    { value: 'other', label: 'Andet' },
                  ]}
                  className="bg-card"
                />
                <Input
                  value={config.supervisedConfig.location}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    supervisedConfig: { ...prev.supervisedConfig, location: e.target.value },
                  }))}
                  placeholder="Fx legeplads, bibliotek, familiecenter"
                  className="bg-card"
                />
              </div>

              {config.pattern === 'supervised' && (
                <div className="space-y-2">
                  <Label className="text-xs">Tilsynsperson (valgfrit)</Label>
                  <Input
                    value={config.supervisedConfig.supervisorName || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      supervisedConfig: { ...prev.supervisedConfig, supervisorRequired: true, supervisorName: e.target.value },
                    }))}
                    placeholder="Navn på tilsynsførende"
                    className="bg-card"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Bemærkninger</Label>
                <Input
                  value={config.supervisedConfig.notes || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    supervisedConfig: { ...prev.supervisedConfig, notes: e.target.value },
                  }))}
                  placeholder="Evt. særlige aftaler"
                  className="bg-card"
                />
              </div>
            </div>

            <WeekAssignmentGrid
              label="Ugeoversigt"
              assignments={config.customWeekConfig.evenWeekAssignments}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              highlightDays={config.supervisedConfig.specificDays}
            />
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-5">
            {/* Skiftetype — card-style picker */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skiftetype</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 'after_daycare',  label: 'Institution',   subtitle: 'Efter vuggestue / børnehave', icon: Calendar },
                  { value: 'specific_time',  label: 'Fast tid',      subtitle: 'Bestemt klokkeslæt',          icon: Clock },
                  { value: 'public_place',   label: 'Offentligt',    subtitle: 'Offentligt mødested',         icon: MapPin },
                  { value: 'specific_days',  label: 'Faste dage',    subtitle: 'Bestemte dage + tidspunkt',   icon: Calendar },
                ] as const).map(opt => {
                  const sel = config.customWeekConfig.handoverContext === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        customWeekConfig: { ...prev.customWeekConfig, handoverContext: opt.value },
                      }))}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-[8px] border-2 p-3 text-left transition-all cursor-pointer",
                        sel
                          ? "border-[#f58a2d] bg-orange-tint-light"
                          : "border-border bg-card hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-[8px]",
                          sel ? "bg-[#f58a2d]" : "bg-muted"
                        )}>
                          <Icon className={cn("h-3.5 w-3.5", sel ? "text-white" : "text-muted-foreground")} />
                        </div>
                        <span className={cn(
                          "text-[13px] font-bold",
                          sel ? "text-[#bf6722]" : "text-foreground"
                        )}>{opt.label}</span>
                      </div>
                      <p className="text-[11px] leading-tight text-muted-foreground">{opt.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tidspunkt */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tidspunkt for skifte</p>
              <Input
                type="time"
                value={config.customWeekConfig.handoverTime}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  customWeekConfig: { ...prev.customWeekConfig, handoverTime: e.target.value },
                }))}
                className="h-11 rounded-[8px] border-border bg-card text-base"
              />
            </div>

            {/* Skiftedage — pill toggles */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skiftedage</p>
              <div className="flex flex-wrap gap-2">
                {swapDays.map(day => {
                  const isActive = config.customWeekConfig.handoverDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleHandoverDay(day.value)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-[#f58a2d] text-white shadow-[0_2px_8px_rgba(245,138,45,0.25)]"
                          : "border border-border bg-card text-muted-foreground hover:border-border"
                      )}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#9e9b93]">
                Vælg de dage hvor barnet skifter forælder
              </p>
            </div>

            {/* Lige uger primært hos */}
            <ParentPicker
              label="Lige uger primært hos"
              selectedParentId={config.primaryParentId}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
              onChange={handlePrimaryParentChange}
            />

            {/* Lige uger */}
            <WeekAssignmentGrid
              label="Lige uger"
              assignments={config.customWeekConfig.evenWeekAssignments}
              onToggle={(day) => handleWeekAssignmentChange('evenWeekAssignments', day)}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />

            {/* Ulige uger */}
            <WeekAssignmentGrid
              label="Ulige uger"
              assignments={config.customWeekConfig.oddWeekAssignments}
              onToggle={(day) => handleWeekAssignmentChange('oddWeekAssignments', day)}
              parent1Id={parent1Id}
              parent2Id={parent2Id}
              parent1Name={parent1Name}
              parent2Name={parent2Name}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[8px] border border-orange-tint bg-orange-tint">
          <Calendar className="h-8 w-8 text-[#f58a2d]" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Samværsplan</h1>
        {household?.caseNumber && (
          <Badge variant="outline" className="mt-2">
            Sagsnr: {household.caseNumber}
          </Badge>
        )}
      </motion.div>

      {/* Parent Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-4"
      >
        {meUser && (
          <div className="flex items-center gap-2 rounded-[8px] border border-primary bg-primary px-4 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={meUser.avatar} />
              <AvatarFallback className="bg-primary text-xs text-white">
                {meUser.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{meUser.name}</p>
              <p className="text-xs text-muted-foreground">Dig</p>
            </div>
          </div>
        )}
        <div className={cn(
          "flex items-center gap-2 rounded-[8px] border px-4 py-2",
          "border-orange-tint bg-orange-tint"
        )}>
          <Avatar className="w-8 h-8">
            {otherUser && <AvatarImage src={otherUser.avatar} />}
            <AvatarFallback className="bg-[#f58a2d] text-xs text-white">
              {otherUser ? otherUser.name[0] : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-[#c66f23]">
              {otherUser ? otherUser.name : 'Forælder 2'}
            </p>
            <p className="text-xs text-[#cf7a33]">
              {otherUser ? 'Forælder 2' : 'Ikke tilknyttet'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Configuration Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="sticky top-0 z-10 bg-card -mx-4">
          <div className="flex items-center">
            {[
              { value: 'general', label: 'Generelt' },
              { value: 'holidays', label: 'Ferie' },
              { value: 'special', label: 'Særlige dage' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative flex-1 py-3 text-center text-[14px] font-semibold transition-colors',
                  activeTab === tab.value ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="custody-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-4 mt-4">
            {/* Pattern Card Grid */}
            <div className="grid grid-cols-2 gap-3">
              {patternOptions.map(opt => {
                const isSelected = config.pattern === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePatternChange(opt.value as CustodyPattern)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-[8px] border-2 p-3.5 text-left transition-all min-h-[120px] cursor-pointer",
                      isSelected
                        ? "border-[#f58a2d] bg-orange-tint-light"
                        : "border-border bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-[8px]",
                        isSelected ? "bg-[#f58a2d]" : "bg-muted"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <span className={cn(
                        "text-[13px] font-bold",
                        isSelected ? "text-[#bf6722]" : "text-foreground"
                      )}>{opt.label}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">{opt.subtitle}</p>
                    <div className="flex gap-[3px] pt-0.5">
                      {opt.preview.map((isMe, i) => (
                        <div key={i} className={cn(
                          "h-[6px] w-[6px] rounded-full",
                          isMe ? "bg-primary" : "bg-[#f58a2d]"
                        )} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Per-type configuration */}
            {renderPatternConfig()}
          </div>
        )}

        {/* Holidays */}
        {activeTab === 'holidays' && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#f58a2d]" />
                Ferie og helligdage
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-foreground"
                onClick={() => setHolidaySelectOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tilføj
              </Button>
            </div>

            {/* User-added holidays */}
            {custodyPlan?.holidays && custodyPlan.holidays.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dine ferieperioder</p>
                {custodyPlan.holidays.map((holiday) => {
                  const parentUser = users.find(u => u.id === holiday.parentId);
                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-card"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-tint flex items-center justify-center">
                        <Sun className="w-3.5 h-3.5 text-[#f58a2d]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{holiday.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(parseISO(holiday.startDate), 'dd. MMM yyyy', { locale: da })} – {format(parseISO(holiday.endDate), 'dd. MMM yyyy', { locale: da })}
                          {holiday.alternateYears
                            ? ` · ${holiday.parentId === currentUser?.id ? 'dig' : parentUser?.name ?? 'Forælder 2'} i ${new Date().getFullYear()}`
                            : ''}
                        </p>
                      </div>
                      {parentUser && (
                        <Avatar className="w-7 h-7 border border-white shadow-sm">
                          <AvatarImage src={parentUser.avatar} />
                          <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                            {parentUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pre-populated Danish holidays list */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Danske helligdage</p>
              <div className="space-y-1">
                {DANISH_HOLIDAYS.map((h) => (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-card"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      h.type === 'period' ? "bg-green-tint" : "bg-orange-tint"
                    )}>
                      <Sun className={cn(
                        "w-3.5 h-3.5",
                        h.type === 'period' ? "text-[#4a9e82]" : "text-[#f58a2d]"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{h.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {h.type === 'period' ? 'Ferieperiode' : h.monthDay.split('-').reverse().join('/')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {h.type === 'period' ? 'Ferie' : 'Helligdag'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Special Days */}
        {activeTab === 'special' && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#9b59b6]" />
                Særlige dage
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-foreground"
                onClick={() => { resetSpecialForm(); setAddFormType('special'); }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tilføj
              </Button>
            </div>

            {custodyPlan?.specialDays && custodyPlan.specialDays.length > 0 ? (
              <div className="space-y-2">
                {custodyPlan.specialDays.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-card"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-tint flex items-center justify-center">
                      <Gift className="w-3.5 h-3.5 text-[#9b59b6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{day.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(parseISO(day.date), 'dd. MMMM yyyy', { locale: da })}
                        {day.alternateYears && ' · skiftende år'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-[8px] bg-card">
                <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-[14px] font-medium text-muted-foreground">Ingen særlige dage</p>
                <p className="text-[12px] text-muted-foreground">Tilføj fødselsdage, mærkedage mv.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 text-lg font-semibold bg-primary text-white hover:bg-primary"
        >
          <Save className="w-5 h-5 mr-2" />
          Gem ændringer
        </Button>
      </motion.div>
      <SavingOverlay open={isSaving} />

      {/* Full-page add form portal */}
      {addFormType && createPortal(
        <div className="fixed inset-0 z-[10000] bg-card flex flex-col">
          {/* Header */}
          <div
            className="flex items-center px-4 py-3 border-b border-border bg-card"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
            <button
              onClick={() => setAddFormType(null)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="flex-1 text-center text-[17px] font-bold text-foreground">
              {addFormType === 'holiday' ? 'Tilføj ferie' : 'Tilføj særlig dag'}
            </h1>
            <button
              onClick={() => setAddFormType(null)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto p-4 space-y-5">
              {addFormType === 'holiday' ? (
                <>
                  {/* Holiday name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navn</Label>
                    <Input
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Fx Påskeferie, Sommerferie..."
                      className="rounded-[8px] border-border bg-card"
                    />
                  </div>

                  {/* Start + end dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fra dato</Label>
                      <Input
                        type="date"
                        value={holidayStart}
                        onChange={(e) => setHolidayStart(e.target.value)}
                        className="rounded-[8px] border-border bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Til dato</Label>
                      <Input
                        type="date"
                        value={holidayEnd}
                        onChange={(e) => setHolidayEnd(e.target.value)}
                        className="rounded-[8px] border-border bg-card"
                      />
                    </div>
                  </div>

                  {/* Parent picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hvem har barnet</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: parent1Id, name: parent1Name, isSelf: true },
                        { id: parent2Id, name: parent2Name, isSelf: false },
                      ].map((parent) => (
                        <button
                          key={parent.id}
                          type="button"
                          onClick={() => setHolidayParent(parent.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-[8px] border p-3 transition-colors",
                            holidayParent === parent.id
                              ? "border-orange-tint bg-orange-tint"
                              : "border-border bg-card hover:bg-background"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold",
                            parent.isSelf ? "bg-primary text-white" : "bg-[#f58a2d] text-white"
                          )}>
                            {parent.name[0]}
                          </div>
                          <span className="text-[13px] font-semibold text-foreground">{parent.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alternating years */}
                  <div className="flex items-center justify-between rounded-[8px] border border-border bg-card p-4">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">Skiftende år</p>
                      <p className="text-[12px] text-muted-foreground">Forældrene skifter hvert år</p>
                    </div>
                    <IOSSwitch checked={holidayAlternate} onCheckedChange={setHolidayAlternate} />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleAddHoliday}
                    className="w-full rounded-[8px] py-6 text-[15px] font-semibold bg-primary text-white hover:bg-primary"
                  >
                    Tilføj ferie
                  </Button>
                </>
              ) : (
                <>
                  {/* Special day description */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beskrivelse</Label>
                    <Input
                      value={specialDescription}
                      onChange={(e) => setSpecialDescription(e.target.value)}
                      placeholder="Fx Annes fødselsdag, Julefrokost..."
                      className="rounded-[8px] border-border bg-card"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dato</Label>
                    <Input
                      type="date"
                      value={specialDate}
                      onChange={(e) => setSpecialDate(e.target.value)}
                      className="rounded-[8px] border-border bg-card"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'birthday' as const, label: 'Fødselsdag', Icon: Cake },
                        { value: 'holiday' as const, label: 'Helligdag', Icon: Star },
                        { value: 'event' as const, label: 'Begivenhed', Icon: CalendarDays },
                      ]).map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setSpecialType(t.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-[8px] border p-3 transition-colors",
                            specialType === t.value
                              ? "border-orange-tint bg-orange-tint"
                              : "border-border bg-card hover:bg-background"
                          )}
                        >
                          <t.Icon className={cn("w-5 h-5", specialType === t.value ? "text-[#f58a2d]" : "text-muted-foreground")} />
                          <span className="text-[11px] font-semibold text-foreground">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parent picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hvem har barnet</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: parent1Id, name: parent1Name, isSelf: true },
                        { id: parent2Id, name: parent2Name, isSelf: false },
                      ].map((parent) => (
                        <button
                          key={parent.id}
                          type="button"
                          onClick={() => setSpecialParent(parent.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-[8px] border p-3 transition-colors",
                            specialParent === parent.id
                              ? "border-orange-tint bg-orange-tint"
                              : "border-border bg-card hover:bg-background"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold",
                            parent.isSelf ? "bg-primary text-white" : "bg-[#f58a2d] text-white"
                          )}>
                            {parent.name[0]}
                          </div>
                          <span className="text-[13px] font-semibold text-foreground">{parent.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alternating years */}
                  <div className="flex items-center justify-between rounded-[8px] border border-border bg-card p-4">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">Skiftende år</p>
                      <p className="text-[12px] text-muted-foreground">Forældrene skifter hvert år</p>
                    </div>
                    <IOSSwitch checked={specialAlternate} onCheckedChange={setSpecialAlternate} />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleAddSpecialDay}
                    className="w-full rounded-[8px] py-6 text-[15px] font-semibold bg-primary text-white hover:bg-primary"
                  >
                    Tilføj særlig dag
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Multi-select holiday portal */}
      {holidaySelectOpen && createPortal(
        <div className="fixed inset-0 z-[10000] bg-card flex flex-col">
          {/* Header */}
          <div
            className="flex items-center px-4 py-3 border-b border-border bg-card"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
            <button
              onClick={() => { setHolidaySelectOpen(false); setSelectedHolidays({}); }}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="flex-1 text-center text-[17px] font-bold text-foreground">
              Vælg helligdage
            </h1>
            <button
              onClick={() => { setHolidaySelectOpen(false); setSelectedHolidays({}); }}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto p-4 space-y-2">
              <AnimatePresence>
                {DANISH_HOLIDAYS.map((h) => {
                  const alreadyAssigned = isHolidayAlreadyAssigned(h.name);
                  const isSelected = h.name in selectedHolidays;

                  return (
                    <div key={h.name} className="space-y-0">
                      {/* Holiday row */}
                      <button
                        onClick={() => {
                          if (alreadyAssigned) return;
                          setSelectedHolidays(prev => {
                            if (h.name in prev) {
                              const next = { ...prev };
                              delete next[h.name];
                              return next;
                            }
                            return { ...prev, [h.name]: { parentId: parent1Id, alternateYears: false } };
                          });
                        }}
                        disabled={alreadyAssigned}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-[8px] transition-colors text-left",
                          alreadyAssigned
                            ? "bg-muted opacity-60"
                            : isSelected
                              ? "bg-orange-tint border border-orange-tint"
                              : "bg-card border border-transparent hover:bg-background"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          h.type === 'period' ? "bg-green-tint" : "bg-orange-tint"
                        )}>
                          <Sun className={cn(
                            "w-3.5 h-3.5",
                            h.type === 'period' ? "text-[#4a9e82]" : "text-[#f58a2d]"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{h.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {h.type === 'period' ? 'Ferieperiode' : h.monthDay.split('-').reverse().join('/')}
                          </p>
                        </div>
                        {alreadyAssigned ? (
                          <Badge variant="outline" className="text-[10px] border-[#4a9e82] text-[#4a9e82] shrink-0">
                            Tilføjet
                          </Badge>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            className="h-5 w-5 shrink-0"
                            tabIndex={-1}
                          />
                        )}
                      </button>

                      {/* Expandable config when selected */}
                      {isSelected && !alreadyAssigned && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-2 ml-10 space-y-3">
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hvem har barnet</p>
                              <div className="flex gap-2">
                                {[
                                  { id: parent1Id, name: parent1Name, isSelf: true },
                                  { id: parent2Id, name: parent2Name, isSelf: false },
                                ].map((parent) => (
                                  <button
                                    key={parent.id}
                                    type="button"
                                    onClick={() => setSelectedHolidays(prev => ({
                                      ...prev,
                                      [h.name]: { ...prev[h.name], parentId: parent.id }
                                    }))}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                                      selectedHolidays[h.name]?.parentId === parent.id
                                        ? "border-orange-tint bg-orange-tint text-[#bf6722]"
                                        : "border-border bg-card text-foreground"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold",
                                      parent.isSelf ? "bg-primary text-white" : "bg-[#f58a2d] text-white"
                                    )}>
                                      {parent.name[0]}
                                    </div>
                                    {parent.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-muted-foreground">Skiftende år</span>
                              <IOSSwitch
                                checked={selectedHolidays[h.name]?.alternateYears ?? false}
                                onCheckedChange={(checked) => setSelectedHolidays(prev => ({
                                  ...prev,
                                  [h.name]: { ...prev[h.name], alternateYears: checked }
                                }))}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </AnimatePresence>

              {/* Tilføj egen */}
              <button
                onClick={() => {
                  setHolidaySelectOpen(false);
                  setSelectedHolidays({});
                  resetHolidayForm();
                  setAddFormType('holiday');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border bg-card py-4 text-[14px] font-semibold text-foreground transition-all hover:border-border active:scale-[0.98] mt-4"
              >
                <Plus className="h-4 w-4" />
                Tilføj egen helligdag
              </button>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div
            className="border-t border-border bg-card px-4 py-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <Button
              onClick={handleAddSelectedHolidays}
              disabled={Object.keys(selectedHolidays).length === 0}
              className="w-full rounded-[8px] py-6 text-[15px] font-semibold bg-primary text-white hover:bg-primary disabled:opacity-40"
            >
              Tilføj valgte ({Object.keys(selectedHolidays).length})
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
