import { useState } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Repeat, 
  Save, 
  Plus, 
  Sun,
  Gift,
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

const patternOptions = [
  { value: '7/7', label: '7/7 - En uge hos hver', description: 'Barnet skifter hver uge' },
  { value: '10/4', label: '10/4 - 10 dage / 4 dage', description: 'Længere perioder hos hver forælder' },
  { value: '14/0', label: '14/0 - To uger / Weekend', description: 'To uger hos den ene, weekend hos den anden' },
  { value: 'weekday-weekend', label: 'Hverdage / Weekend', description: 'Hverdage hos én og weekend hos den anden' },
  { value: 'alternating', label: 'Alternerende dage', description: 'Skift hver anden dag' },
  { value: 'custom', label: 'Tilpasset', description: 'Definer din egen plan' },
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
  const { custodyPlans, household, users, children, updateCustodyPlan } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const currentChild = children[0];
  const parent1 = users.find(u => u.id === currentChild?.parent1Id);
  const parent2 = users.find(u => u.id === currentChild?.parent2Id);
  const parent1Id = parent1?.id || '';
  const parent2Id = parent2?.id || '';
  const defaultEvenWeek = buildWeekAssignments(parent1Id, parent2Id);
  const defaultOddWeek = buildWeekAssignments(parent2Id, parent1Id);

  // Local state for editing
  const [config, setConfig] = useState(() => ({
    pattern: custodyPlan?.pattern || '7/7',
    swapDay: custodyPlan?.swapDay ?? 4,
    swapTime: custodyPlan?.swapTime || '18:00',
    parent1Weeks: custodyPlan?.parent1Weeks || 1,
    parent2Weeks: custodyPlan?.parent2Weeks || 1,
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

      {/* Parent Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-4"
      >
        {parent1 && (
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2",
            parent1.color === 'warm'
              ? "border-[#f3c59d] bg-[#fff2e6]"
              : "border-[#2f2f2f] bg-[#2f2f2f]"
          )}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={parent1.avatar} />
              <AvatarFallback className={cn(
                "text-xs",
                parent1.color === 'warm' ? "bg-[#f58a2d] text-white" : "bg-[#4f4b45] text-white"
              )}>
                {parent1.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className={cn(
                "text-sm font-medium",
                parent1.color === 'warm' ? "text-[#c66f23]" : "text-white"
              )}>{parent1.name}</p>
              <p className={cn(
                "text-xs",
                parent1.color === 'warm' ? "text-[#cf7a33]" : "text-[#dfddd5]"
              )}>Forælder 1</p>
            </div>
          </div>
        )}
        {parent2 && (
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2",
            parent2.color === 'warm'
              ? "border-[#f3c59d] bg-[#fff2e6]"
              : "border-[#2f2f2f] bg-[#2f2f2f]"
          )}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={parent2.avatar} />
              <AvatarFallback className={cn(
                "text-xs",
                parent2.color === 'warm' ? "bg-[#f58a2d] text-white" : "bg-[#4f4b45] text-white"
              )}>
                {parent2.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className={cn(
                "text-sm font-medium",
                parent2.color === 'warm' ? "text-[#c66f23]" : "text-white"
              )}>{parent2.name}</p>
              <p className={cn(
                "text-xs",
                parent2.color === 'warm' ? "text-[#cf7a33]" : "text-[#dfddd5]"
              )}>Forælder 2</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Configuration Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Generelt</TabsTrigger>
            <TabsTrigger value="holidays">Ferie</TabsTrigger>
            <TabsTrigger value="special">Særlige dage</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-slate-500" />
                  Samværsmodel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vælg model</Label>
                  <Select 
                    value={config.pattern} 
                    onValueChange={(v) => setConfig({...config, pattern: v as CustodyPattern})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {patternOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <p className="font-medium">{opt.label}</p>
                            <p className="text-xs text-slate-500">{opt.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {config.pattern !== 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Skiftedag</Label>
                      <Select
                        value={config.swapDay.toString()}
                        onValueChange={(v) => setConfig({ ...config, swapDay: parseInt(v) })}
                      >
                        <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label>Skiftetidspunkt</Label>
                      <Input
                        type="time"
                        value={config.swapTime}
                        onChange={(e) => setConfig({ ...config, swapTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {config.pattern === '7/7' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Uger hos {parent1?.name}</Label>
                      <Input 
                        type="number"
                        min={1}
                        max={4}
                        value={config.parent1Weeks}
                        onChange={(e) => setConfig({...config, parent1Weeks: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Uger hos {parent2?.name}</Label>
                      <Input 
                        type="number"
                        min={1}
                        max={4}
                        value={config.parent2Weeks}
                        onChange={(e) => setConfig({...config, parent2Weeks: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                )}

                {config.pattern === 'custom' && (
                  <div className="space-y-4 rounded-xl border border-[#f3c59d] bg-[#fff7f1] p-4">
                    <div className="space-y-2">
                      <Label>Skiftetype</Label>
                      <Select
                        value={config.customWeekConfig.handoverContext}
                        onValueChange={(value: 'after_daycare' | 'specific_time') => setConfig(prev => ({
                          ...prev,
                          customWeekConfig: {
                            ...prev.customWeekConfig,
                            handoverContext: value,
                          },
                        }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="after_daycare">Efter vuggestue / institution</SelectItem>
                          <SelectItem value="specific_time">Fast klokkeslæt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tidspunkt for skifte</Label>
                      <Input
                        type="time"
                        value={config.customWeekConfig.handoverTime}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          customWeekConfig: {
                            ...prev.customWeekConfig,
                            handoverTime: e.target.value,
                          },
                        }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Skiftedage</Label>
                      <div className="flex flex-wrap gap-2">
                        {swapDays.map(day => {
                          const isSelected = config.customWeekConfig.handoverDays.includes(day.value);
                          return (
                            <Button
                              key={day.value}
                              type="button"
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => toggleHandoverDay(day.value)}
                              className={isSelected ? 'bg-[#f58a2d] text-white hover:bg-[#e47921]' : 'bg-white'}
                            >
                              {day.label}
                            </Button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-600">
                        Vælg de dage hvor barnet skifter forælder, fx mandag, onsdag og fredag.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Lige uger</Label>
                      <div className="space-y-2">
                        {swapDays.map(day => (
                          <div key={`even-${day.value}`} className="grid grid-cols-[86px_1fr] items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">{day.label}</p>
                            <Select
                              value={config.customWeekConfig.evenWeekAssignments[day.value] || parent1Id}
                              onValueChange={(value) => handleWeekAssignmentChange('evenWeekAssignments', day.value, value)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Vælg forælder" />
                              </SelectTrigger>
                              <SelectContent>
                                {parent1 && (
                                  <SelectItem value={parent1.id}>{parent1.name}</SelectItem>
                                )}
                                {parent2 && (
                                  <SelectItem value={parent2.id}>{parent2.name}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ulige uger</Label>
                      <div className="space-y-2">
                        {swapDays.map(day => (
                          <div key={`odd-${day.value}`} className="grid grid-cols-[86px_1fr] items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">{day.label}</p>
                            <Select
                              value={config.customWeekConfig.oddWeekAssignments[day.value] || parent2Id}
                              onValueChange={(value) => handleWeekAssignmentChange('oddWeekAssignments', day.value, value)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Vælg forælder" />
                              </SelectTrigger>
                              <SelectContent>
                                {parent1 && (
                                  <SelectItem value={parent1.id}>{parent1.name}</SelectItem>
                                )}
                                {parent2 && (
                                  <SelectItem value={parent2.id}>{parent2.name}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* Holidays */}
          <TabsContent value="holidays" className="space-y-4 mt-4">
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
          </TabsContent>

          {/* Special Days */}
          <TabsContent value="special" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
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
