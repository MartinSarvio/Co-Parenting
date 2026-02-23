import { useState } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// Tabs replaced by underline-style tabs
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import type { CustodyPattern, CustodyPlan } from '@/types';

const swapDays = [
  { value: 0, label: 'Mandag' },
  { value: 1, label: 'Tirsdag' },
  { value: 2, label: 'Onsdag' },
  { value: 3, label: 'Torsdag' },
  { value: 4, label: 'Fredag' },
  { value: 5, label: 'Lørdag' },
  { value: 6, label: 'Søndag' },
];

// Each preview array = 7 days (Mon-Sun): true = me (cool/sort), false = other parent (warm/orange)
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

export function CustodyConfig() {
  const { custodyPlans, household, users, children, updateCustodyPlan, currentUser } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const currentChild = children[0];

  // Me = cool (sort), other = warm (orange) — same logic as Samversplan
  const meUser = currentUser;
  const otherParentId = currentChild
    ? (currentChild.parent1Id === currentUser?.id
        ? currentChild.parent2Id
        : currentChild.parent2Id === currentUser?.id
          ? currentChild.parent1Id
          : currentChild.parent2Id)
    : undefined;
  const otherUser = otherParentId
    ? users.find(u => u.id === otherParentId && u.id !== currentUser?.id)
    : undefined;

  const parent1Id = meUser?.id || 'parent1';
  // CRITICAL: parent2Id must NEVER equal parent1Id — use a stable placeholder when
  // the other parent is not a separate user in the app.
  const rawOther = otherUser?.id || otherParentId;
  const parent2Id = rawOther && rawOther !== parent1Id ? rawOther : '__parent2__';
  const defaultEvenWeek = buildWeekAssignments(parent1Id, parent2Id);
  const defaultOddWeek = buildWeekAssignments(parent2Id, parent1Id);

  // Local state for editing
  const [config, setConfig] = useState(() => ({
    pattern: custodyPlan?.pattern || '7/7',
    swapDay: custodyPlan?.swapDay ?? 4,
    swapTime: custodyPlan?.swapTime || '18:00',
    parent1Weeks: custodyPlan?.parent1Weeks || 1,
    parent2Weeks: custodyPlan?.parent2Weeks || 1,
    supervisedConfig: custodyPlan?.supervisedConfig || {
      frequencyWeeks: 2,
      durationHours: 3,
      location: '',
      locationType: 'public' as const,
      supervisorRequired: false,
      supervisorName: '',
      specificDays: [5], // Saturday
      startTime: '10:00',
      notes: '',
    },
    customWeekConfig: {
      handoverDays: custodyPlan?.customWeekConfig?.handoverDays?.length
        ? custodyPlan.customWeekConfig.handoverDays
        : defaultHandoverDays,
      handoverTime: custodyPlan?.customWeekConfig?.handoverTime || custodyPlan?.swapTime || '16:00',
      handoverContext: custodyPlan?.customWeekConfig?.handoverContext || 'after_daycare',
      evenWeekAssignments: normalizeAssignments(
        custodyPlan?.customWeekConfig?.evenWeekAssignments,
        defaultEvenWeek
      ),
      oddWeekAssignments: normalizeAssignments(
        custodyPlan?.customWeekConfig?.oddWeekAssignments,
        defaultOddWeek
      ),
    },
  }));

  const handleWeekAssignmentChange = (
    weekType: 'evenWeekAssignments' | 'oddWeekAssignments',
    day: number,
    assignedParentId: string
  ) => {
    setConfig(prev => ({
      ...prev,
      customWeekConfig: {
        ...prev.customWeekConfig,
        [weekType]: prev.customWeekConfig[weekType].map((parentId, index) =>
          index === day ? assignedParentId : parentId
        ),
      },
    }));
  };

  const toggleHandoverDay = (day: number) => {
    setConfig(prev => {
      const exists = prev.customWeekConfig.handoverDays.includes(day);
      const handoverDays = exists
        ? prev.customWeekConfig.handoverDays.filter(d => d !== day)
        : [...prev.customWeekConfig.handoverDays, day];

      return {
        ...prev,
        customWeekConfig: {
          ...prev.customWeekConfig,
          handoverDays: handoverDays.sort((a, b) => a - b),
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (custodyPlan) {
      const updatedPlan: Partial<CustodyPlan> = {
        pattern: config.pattern as CustodyPattern,
        swapDay: config.swapDay,
        swapTime: config.swapTime,
        parent1Weeks: config.parent1Weeks,
        parent2Weeks: config.parent2Weeks,
      };

      if (config.pattern === 'supervised' || config.pattern === 'supervised_limited') {
        updatedPlan.supervisedConfig = config.supervisedConfig;
      }

      if (config.pattern === 'custom') {
        const normalizedHandoverDays = [...new Set(config.customWeekConfig.handoverDays)].sort((a, b) => a - b);
        const handoverDays = normalizedHandoverDays.length ? normalizedHandoverDays : defaultHandoverDays;
        const evenWeekAssignments = normalizeAssignments(config.customWeekConfig.evenWeekAssignments, defaultEvenWeek);
        const oddWeekAssignments = normalizeAssignments(config.customWeekConfig.oddWeekAssignments, defaultOddWeek);
        const handoverTime = config.customWeekConfig.handoverTime || config.swapTime || '16:00';

        updatedPlan.customWeekConfig = {
          handoverDays,
          handoverTime,
          handoverContext: config.customWeekConfig.handoverContext,
          evenWeekAssignments,
          oddWeekAssignments,
        };
        updatedPlan.swapDay = handoverDays[0];
        updatedPlan.swapTime = handoverTime;

        if (parent1Id && parent2Id) {
          updatedPlan.parent1Days = evenWeekAssignments.flatMap((assignedParentId, day) =>
            assignedParentId === parent1Id ? [day] : []
          );
          updatedPlan.parent2Days = evenWeekAssignments.flatMap((assignedParentId, day) =>
            assignedParentId === parent2Id ? [day] : []
          );
        }
      }

      updateCustodyPlan(custodyPlan.id, updatedPlan);
    }
    
    setIsSaving(false);
    toast.success('Samværsplan gemt!');
  };


  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f3c59d] bg-[#fff2e6]">
          <Calendar className="h-8 w-8 text-[#f58a2d]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#2f2f2d]">Samværsplan</h1>
        <p className="text-[#75736b]">Konfigurer jeres samværsordning</p>
        {household?.caseNumber && (
          <Badge variant="outline" className="mt-2">
            Sagsnr: {household.caseNumber}
          </Badge>
        )}
      </motion.div>

      {/* Parent Overview — Me = cool (sort), Other = warm (orange) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-4"
      >
        {/* Me — always cool/sort */}
        {meUser && (
          <div className="flex items-center gap-2 rounded-xl border border-[#2f2f2f] bg-[#2f2f2f] px-4 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={meUser.avatar} />
              <AvatarFallback className="bg-[#4f4b45] text-xs text-white">
                {meUser.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{meUser.name}</p>
              <p className="text-xs text-[#dfddd5]">Dig</p>
            </div>
          </div>
        )}
        {/* Other parent — always warm/orange, or placeholder */}
        <div className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2",
          "border-[#f3c59d] bg-[#fff2e6]"
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
        {/* Underline-style Tabs */}
        <div className="sticky top-0 z-10 bg-[#faf9f6] pb-0">
          <div className="flex items-center border-b border-[#e5e3dc]">
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
                  activeTab === tab.value ? 'text-[#2f2f2d]' : 'text-[#b0ada4]'
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="custody-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2f2f2d] rounded-full"
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
                    onClick={() => setConfig({...config, pattern: opt.value as CustodyPattern})}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition-all",
                      isSelected
                        ? "border-[#f3c59d] bg-[#fff2e6] shadow-[0_2px_12px_rgba(245,138,45,0.12)]"
                        : "border-[#e5e3dc] bg-white hover:border-[#cccbc3]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        isSelected ? "bg-[#f58a2d]" : "bg-[#f0efe8]"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-[#75736b]")} />
                      </div>
                      <span className={cn(
                        "text-[13px] font-bold",
                        isSelected ? "text-[#bf6722]" : "text-[#2f2f2d]"
                      )}>{opt.label}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-[#75736b]">{opt.subtitle}</p>
                    {/* Mini week preview — 7 dots */}
                    <div className="flex gap-[3px] pt-0.5">
                      {opt.preview.map((isMe, i) => (
                        <div key={i} className={cn(
                          "h-[6px] w-[6px] rounded-full",
                          isMe ? "bg-[#2f2f2f]" : "bg-[#f58a2d]"
                        )} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Swap day & time — shown for non-custom patterns */}
            {config.pattern !== 'custom' && (
              <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Skiftedetaljer</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Skiftedag</Label>
                    <Select
                      value={config.swapDay.toString()}
                      onValueChange={(v) => setConfig({ ...config, swapDay: parseInt(v) })}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-[#e5e3dc]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {swapDays.map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tidspunkt</Label>
                    <Input
                      type="time"
                      value={config.swapTime}
                      onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                      className="h-10 rounded-xl border-[#e5e3dc]"
                    />
                  </div>
                </div>

                {config.pattern === '7/7' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Uger hos {meUser?.name?.split(' ')[0] || 'dig'}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={config.parent1Weeks}
                        onChange={(e) => setConfig({...config, parent1Weeks: parseInt(e.target.value) || 1})}
                        className="h-10 rounded-xl border-[#e5e3dc]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Uger hos {otherUser?.name?.split(' ')[0] || 'Forælder 2'}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={config.parent2Weeks}
                        onChange={(e) => setConfig({...config, parent2Weeks: parseInt(e.target.value) || 1})}
                        className="h-10 rounded-xl border-[#e5e3dc]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

                {/* Supervised visitation config */}
                {(config.pattern === 'supervised' || config.pattern === 'supervised_limited') && (
                  <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
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
                          value={config.supervisedConfig.frequencyWeeks}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            supervisedConfig: { ...prev.supervisedConfig, frequencyWeeks: parseInt(e.target.value) || 2 },
                          }))}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Antal timer</Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={config.supervisedConfig.durationHours}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            supervisedConfig: { ...prev.supervisedConfig, durationHours: parseInt(e.target.value) || 3 },
                          }))}
                          className="bg-white"
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
                        className="bg-white"
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
                                return { ...prev, supervisedConfig: { ...prev.supervisedConfig, specificDays: next.sort((a, b) => a - b) } };
                              })}
                              className={isSelected ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white'}
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
                      <Select
                        value={config.supervisedConfig.locationType}
                        onValueChange={(v: 'public' | 'home' | 'institution' | 'other') => setConfig(prev => ({
                          ...prev,
                          supervisedConfig: { ...prev.supervisedConfig, locationType: v },
                        }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Offentligt sted</SelectItem>
                          <SelectItem value="home">Hjemme hos forælder</SelectItem>
                          <SelectItem value="institution">Institution/familiecenter</SelectItem>
                          <SelectItem value="other">Andet</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={config.supervisedConfig.location}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          supervisedConfig: { ...prev.supervisedConfig, location: e.target.value },
                        }))}
                        placeholder="Fx legeplads, bibliotek, familiecenter"
                        className="bg-white"
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
                          className="bg-white"
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
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}

                {config.pattern === 'custom' && (
                  <div className="space-y-5">
                    {/* ── Skiftetype — card-style picker ── */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Skiftetype</p>
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
                                customWeekConfig: { ...prev.customWeekConfig, handoverContext: opt.value as any },
                              }))}
                              className={cn(
                                "flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-all",
                                sel
                                  ? "border-[#f3c59d] bg-[#fff2e6] shadow-[0_2px_12px_rgba(245,138,45,0.12)]"
                                  : "border-[#e5e3dc] bg-white hover:border-[#cccbc3]"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-lg",
                                  sel ? "bg-[#f58a2d]" : "bg-[#f0efe8]"
                                )}>
                                  <Icon className={cn("h-3.5 w-3.5", sel ? "text-white" : "text-[#75736b]")} />
                                </div>
                                <span className={cn(
                                  "text-[13px] font-bold",
                                  sel ? "text-[#bf6722]" : "text-[#2f2f2d]"
                                )}>{opt.label}</span>
                              </div>
                              <p className="text-[11px] leading-tight text-[#75736b]">{opt.subtitle}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Tidspunkt ── */}
                    <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Tidspunkt for skifte</p>
                      <Input
                        type="time"
                        value={config.customWeekConfig.handoverTime}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          customWeekConfig: { ...prev.customWeekConfig, handoverTime: e.target.value },
                        }))}
                        className="h-11 rounded-xl border-[#e5e3dc] bg-[#faf9f6] text-base"
                      />
                    </div>

                    {/* ── Skiftedage — pill toggles ── */}
                    <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4 space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Skiftedage</p>
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
                                  : "border border-[#e5e3dc] bg-[#faf9f6] text-[#75736b] hover:border-[#cccbc3]"
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

                    {/* ── Lige uger — visual day assignment ── */}
                    <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Lige uger</p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {swapDays.map(day => {
                          const assignedId = config.customWeekConfig.evenWeekAssignments[day.value] || parent1Id;
                          const isMe = assignedId === parent1Id;
                          return (
                            <button
                              key={`even-${day.value}`}
                              type="button"
                              onClick={() => handleWeekAssignmentChange(
                                'evenWeekAssignments',
                                day.value,
                                isMe ? parent2Id : parent1Id
                              )}
                              className={cn(
                                "flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 transition-all",
                                isMe
                                  ? "border-[#2f2f2f] bg-[#2f2f2f]"
                                  : "border-[#f3c59d] bg-[#fff2e6]"
                              )}
                            >
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                isMe ? "text-[#b0ada4]" : "text-[#c87a30]"
                              )}>
                                {day.label.slice(0, 3)}
                              </span>
                              <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                                isMe
                                  ? "bg-white/20 text-white"
                                  : "bg-[#f58a2d]/20 text-[#c87a30]"
                              )}>
                                {isMe
                                  ? (meUser?.name?.[0] || 'D')
                                  : (otherUser?.name?.[0] || 'F2')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#2f2f2f]" />
                          <span className="text-[11px] text-[#75736b]">{meUser?.name?.split(' ')[0] || 'Dig'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#f58a2d]" />
                          <span className="text-[11px] text-[#75736b]">{otherUser?.name?.split(' ')[0] || 'Forælder 2'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Ulige uger — visual day assignment ── */}
                    <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Ulige uger</p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {swapDays.map(day => {
                          const assignedId = config.customWeekConfig.oddWeekAssignments[day.value] || parent2Id;
                          const isMe = assignedId === parent1Id;
                          return (
                            <button
                              key={`odd-${day.value}`}
                              type="button"
                              onClick={() => handleWeekAssignmentChange(
                                'oddWeekAssignments',
                                day.value,
                                isMe ? parent2Id : parent1Id
                              )}
                              className={cn(
                                "flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 transition-all",
                                isMe
                                  ? "border-[#2f2f2f] bg-[#2f2f2f]"
                                  : "border-[#f3c59d] bg-[#fff2e6]"
                              )}
                            >
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                isMe ? "text-[#b0ada4]" : "text-[#c87a30]"
                              )}>
                                {day.label.slice(0, 3)}
                              </span>
                              <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                                isMe
                                  ? "bg-white/20 text-white"
                                  : "bg-[#f58a2d]/20 text-[#c87a30]"
                              )}>
                                {isMe
                                  ? (meUser?.name?.[0] || 'D')
                                  : (otherUser?.name?.[0] || 'F2')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#2f2f2f]" />
                          <span className="text-[11px] text-[#75736b]">{meUser?.name?.split(' ')[0] || 'Dig'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#f58a2d]" />
                          <span className="text-[11px] text-[#75736b]">{otherUser?.name?.split(' ')[0] || 'Forælder 2'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

          </div>
        )}

        {/* Holidays */}
        {activeTab === 'holidays' && (
          <div className="space-y-4 mt-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sun className="w-5 h-5 text-slate-500" />
                    Ferie og helligdage
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Tilføj
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {custodyPlan?.holidays && custodyPlan.holidays.length > 0 ? (
                  <div className="space-y-3">
                    {custodyPlan.holidays.map((holiday: { id: string; name: string; startDate: string; endDate: string; parentId: string }) => (
                      <div 
                        key={holiday.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <Sun className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{holiday.name}</p>
                          <p className="text-sm text-slate-500">
                            {format(parseISO(holiday.startDate), 'dd. MMM', { locale: da })} - {format(parseISO(holiday.endDate), 'dd. MMM yyyy', { locale: da })}
                          </p>
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={users.find(u => u.id === holiday.parentId)?.avatar} />
                          <AvatarFallback className="text-xs">
                            {users.find(u => u.id === holiday.parentId)?.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sun className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Ingen ferieplanlagt endnu</p>
                    <p className="text-sm text-slate-400">Tilføj ferieperioder for at se dem her</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Special Days */}
        {activeTab === 'special' && (
          <div className="space-y-4 mt-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5 text-slate-500" />
                    Særlige dage
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Tilføj
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {custodyPlan?.specialDays && custodyPlan.specialDays.length > 0 ? (
                  <div className="space-y-3">
                    {custodyPlan.specialDays.map((day: { id: string; date: string; type: string; description: string; alternateYears?: boolean }) => (
                      <div 
                        key={day.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{day.description}</p>
                          <p className="text-sm text-slate-500">
                            {format(parseISO(day.date), 'dd. MMMM', { locale: da })}
                            {day.alternateYears && ' (skiftende år)'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Ingen særlige dage</p>
                    <p className="text-sm text-slate-400">Tilføj fødselsdage, juleaftener mv.</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
          className="w-full h-14 text-lg font-semibold bg-[#2f2f2f] text-white hover:bg-[#242424]"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Gemmer...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Gem ændringer
            </>
          )}
        </Button>
      </motion.div>

    </div>
  );
}
