import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { getDefaultBillingModel } from '@/lib/subscription';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Users,
  Calendar,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Heart,
  Shield,
  Clock,
  Lock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { registerUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { mapChild, mapHousehold, extractUsersFromMembers } from '@/lib/mappers';
import type { DbChild, DbHouseholdMember } from '@/lib/mappers';
import { RibbonBanner } from '@/components/custom/RibbonBanner';

type FamilyType = 'co-parents-fixed' | 'co-parents-flex' | 'same-household' | 'blended';
type CustodyPattern = '7/7' | '10/4' | 'custom';

interface OnboardingData {
  familyType: FamilyType | null;
  parentName: string;
  parentEmail: string;
  parentPassword: string;
  childName: string;
  childBirthDate: string;
  otherParentEmail: string;
  custodyPattern: CustodyPattern | null;
}

const familyTypes: { value: FamilyType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'co-parents-fixed',
    label: 'Co-parents med fast ordning',
    description: 'Fast samværsplan som 7/7 eller 10/4',
    icon: <Calendar className="w-6 h-6" />
  },
  {
    value: 'co-parents-flex',
    label: 'Co-parents med fleksibel ordning',
    description: 'Tilpasset plan efter behov',
    icon: <Clock className="w-6 h-6" />
  },
  {
    value: 'same-household',
    label: 'Samboende familie',
    description: 'Samme husstand, travl hverdag',
    icon: <Heart className="w-6 h-6" />
  },
  {
    value: 'blended',
    label: 'Bonusfamilie',
    description: 'Flere børn og kalendere',
    icon: <Users className="w-6 h-6" />
  },
];

const custodyPatterns: { value: CustodyPattern; label: string; description: string }[] = [
  { value: '7/7', label: '7/7 Ordning', description: 'En uge hos hver forælder' },
  { value: '10/4', label: '10/4 Ordning', description: '10 dage / 4 dage' },
  { value: 'custom', label: 'Tilpasset', description: 'Lav din egen plan' },
];

interface OnboardingFlowProps {
  onSwitchToLogin: () => void;
}

export function OnboardingFlow({ onSwitchToLogin }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    familyType: null,
    parentName: '',
    parentEmail: '',
    parentPassword: '',
    childName: '',
    childBirthDate: '',
    otherParentEmail: '',
    custodyPattern: null,
  });

  const { setAuthenticated, setCurrentUser, addChild, setHousehold, addCustodyPlan, hydrateFromServer } = useAppStore();

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !data.familyType) {
      toast.error('Vælg venligst en familietype');
      return;
    }
    if (step === 2 && (!data.parentName || !data.parentEmail || !data.parentPassword)) {
      toast.error('Udfyld venligst alle felter');
      return;
    }
    if (step === 2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail)) {
      toast.error('Indtast venligst en gyldig email');
      return;
    }
    if (step === 2 && data.parentPassword.length < 6) {
      toast.error('Adgangskode skal være mindst 6 tegn');
      return;
    }
    if (step === 3 && (!data.childName || !data.childBirthDate)) {
      toast.error('Udfyld venligst barnets oplysninger');
      return;
    }
    if (step === 5 && data.familyType !== 'same-household' && !data.custodyPattern) {
      toast.error('Vælg venligst en samværsmodel');
      return;
    }

    if (step === 6) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);

    const familyMode: 'together' | 'blended' | 'co_parenting' = data.familyType === 'same-household'
      ? 'together'
      : data.familyType === 'blended'
        ? 'blended'
        : 'co_parenting';

    try {
      // 1. Register user on backend
      const { user } = await registerUser({
        email: data.parentEmail,
        password: data.parentPassword,
        name: data.parentName,
        role: 'parent',
        color: 'warm',
      });

      setCurrentUser(user);

      // 2. Create household in Supabase
      const { data: householdRow, error: hhErr } = await supabase
        .from('households')
        .insert({ name: `${data.childName}'s Familie`, family_mode: familyMode })
        .select()
        .single();
      if (hhErr || !householdRow) throw new Error(hhErr?.message || 'Kunne ikke oprette husstand');

      // Add creator as member
      await supabase.from('household_members').insert({
        user_id: user.id,
        household_id: householdRow.id,
        role: 'parent',
      });

      // Fetch members for mapping
      const { data: membersRaw } = await supabase
        .from('household_members')
        .select('*, user:profiles(*)')
        .eq('household_id', householdRow.id);

      const members = (membersRaw || []) as unknown as DbHouseholdMember[];
      const householdMapped = mapHousehold(householdRow, members);
      const users = extractUsersFromMembers(members);

      // Enrich household with local subscription info
      const household = {
        ...householdMapped,
        calendarSources: [],
        subscription: {
          plan: 'free' as const,
          billingModel: getDefaultBillingModel(familyMode),
          status: 'active' as const,
          startedAt: new Date().toISOString(),
        },
        singleParentSupport: {
          evidenceVaultEnabled: false,
          autoArchiveReceipts: false,
          lawyerIds: [] as string[],
        },
      };

      setHousehold(household);
      hydrateFromServer({ users });

      // 3. Create child in Supabase
      const { data: childRow, error: childErr } = await supabase
        .from('children')
        .insert({
          name: data.childName,
          birth_date: data.childBirthDate,
          parent1_id: user.id,
          parent2_id: user.id,
          household_id: householdRow.id,
        })
        .select()
        .single();
      if (childErr || !childRow) throw new Error(childErr?.message || 'Kunne ikke oprette barn');

      const child = mapChild(childRow as DbChild);
      addChild(child);

      // 4. Create local custody plan (no backend route yet)
      const selectedCustodyPattern: CustodyPattern = data.familyType === 'same-household'
        ? 'custom'
        : data.custodyPattern || '7/7';

      // Generer uge-tildelinger baseret på valgt mønster
      const p1 = user.id;
      const p2 = '__parent2__'; // Placeholder indtil forælder 2 tilknyttes
      const weekAssignments = (() => {
        switch (selectedCustodyPattern) {
          case '7/7': return { even: Array(7).fill(p1) as string[], odd: Array(7).fill(p2) as string[] };
          case '10/4': return { even: Array(7).fill(p1) as string[], odd: [p1, p1, p1, p2, p2, p2, p2] };
          default: return { even: Array(7).fill(p1) as string[], odd: Array(7).fill(p2) as string[] };
        }
      })();

      const custodyPlan = {
        id: `cp-${Date.now()}`,
        name: data.familyType === 'same-household' ? 'Hverdagsplan' : `${selectedCustodyPattern} Ordning`,
        pattern: selectedCustodyPattern,
        startDate: new Date().toISOString().split('T')[0],
        swapDay: 4,
        swapTime: '18:00',
        parent1Weeks: 1,
        parent2Weeks: 1,
        parent1Days: weekAssignments.even.flatMap((pid: string, day: number) => pid === p1 ? [day] : []),
        parent2Days: weekAssignments.even.flatMap((pid: string, day: number) => pid === p2 ? [day] : []),
        childId: child.id,
        customWeekConfig: {
          handoverDays: [4],
          handoverTime: '18:00',
          handoverContext: 'after_daycare' as const,
          evenWeekAssignments: weekAssignments.even,
          oddWeekAssignments: weekAssignments.odd,
        },
      };

      addCustodyPlan(custodyPlan);

      // 5. If other parent email provided, try invite
      if (data.otherParentEmail) {
        try {
          // Find partner by email and add to household
          const { data: partner } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', data.otherParentEmail.toLowerCase().trim())
            .single();
          if (partner) {
            await supabase.from('household_members').insert({
              user_id: partner.id,
              household_id: householdRow.id,
              role: 'parent',
            });
          }
        } catch {
          console.log('Partner invitation pending — they need to register first');
        }
      }

      setAuthenticated(true);
      toast.success('Velkommen! Din konto er oprettet.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Noget gik galt. Prøv igen.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#f7a95c] to-[#f58a2d] flex items-center justify-center shadow-xl">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-[2.2rem] font-extrabold tracking-[-0.04em] bg-gradient-to-br from-[#f7a95c] via-[#f58a2d] to-[#e8773f] bg-clip-text text-transparent mb-1">Huska</h1>
              <p className="text-[0.85rem] text-muted-foreground max-w-sm mx-auto">
                Husk alt det vigtige i familien. Overblik, struktur og mindre friktion.
              </p>
            </div>
            <div className="flex justify-center gap-4 text-[13px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>Sikkert</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Tidsbesparende</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>Gratis</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleNext}
                className="w-full h-[50px] rounded-[8px] text-white font-semibold text-[1rem] tracking-[-0.01em] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)',
                  boxShadow: '0 6px 20px rgba(245, 138, 45, 0.35)',
                }}
              >
                Opret konto
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="text-center pt-1">
                <button
                  onClick={onSwitchToLogin}
                  className="text-[13px] text-muted-foreground"
                >
                  Har du allerede en konto?{' '}
                  <span className="font-semibold text-[#f58a2d]">Log ind</span>
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Vælg din familietype</h2>
              <p className="text-[13px] text-muted-foreground">Dette hjælper os med at tilpasse appen til dine behov</p>
            </div>
            <RadioGroup
              value={data.familyType || ''}
              onValueChange={(v) => updateData('familyType', v as FamilyType)}
              className="space-y-2.5"
            >
              {familyTypes.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex items-start gap-3 p-3.5 rounded-[8px] border-2 cursor-pointer transition-all ${
                    data.familyType === type.value
                      ? 'border-[#f58a2d] bg-orange-tint-light'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <div className={`p-2 rounded-[8px] ${data.familyType === type.value ? 'bg-[#f58a2d] text-white' : 'bg-background text-muted-foreground'}`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[14px]">{type.label}</p>
                    <p className="text-[12px] text-muted-foreground">{type.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Opret din konto</h2>
              <p className="text-[13px] text-muted-foreground">Dine oplysninger gemmes sikkert</p>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="parentName" className="text-[13px] text-muted-foreground font-medium">Dit navn</Label>
                <Input
                  id="parentName"
                  value={data.parentName}
                  onChange={(e) => updateData('parentName', e.target.value)}
                  placeholder="F.eks. Sarah"
                  className="h-[50px] text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentEmail" className="text-[13px] text-muted-foreground font-medium">Din email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={data.parentEmail}
                  onChange={(e) => updateData('parentEmail', e.target.value)}
                  placeholder="sarah@example.com"
                  className="h-[50px] text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentPassword" className="text-[13px] text-muted-foreground font-medium">Adgangskode</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground z-10" />
                  <Input
                    id="parentPassword"
                    type="password"
                    value={data.parentPassword}
                    onChange={(e) => updateData('parentPassword', e.target.value)}
                    placeholder="Mindst 6 tegn"
                    className="h-[50px] pl-11 text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Tilføj dit barn</h2>
              <p className="text-[13px] text-muted-foreground">Du kan tilføje flere børn senere</p>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="childName" className="text-[13px] text-muted-foreground font-medium">Barnets navn</Label>
                <Input
                  id="childName"
                  value={data.childName}
                  onChange={(e) => updateData('childName', e.target.value)}
                  placeholder="F.eks. Emma"
                  className="h-[50px] text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="childBirthDate" className="text-[13px] text-muted-foreground font-medium">Barnets fødselsdato</Label>
                <Input
                  id="childBirthDate"
                  type="date"
                  value={data.childBirthDate}
                  onChange={(e) => updateData('childBirthDate', e.target.value)}
                  className="h-[50px] text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Inviter den anden forælder</h2>
              <p className="text-[13px] text-muted-foreground">Send en invitation til at deltage i familien</p>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="otherParentEmail" className="text-[13px] text-muted-foreground font-medium">Den anden forælders email</Label>
                <Input
                  id="otherParentEmail"
                  type="email"
                  value={data.otherParentEmail}
                  onChange={(e) => updateData('otherParentEmail', e.target.value)}
                  placeholder="michael@example.com"
                  className="h-[50px] text-[15px] bg-card/80 border-border rounded-[8px] placeholder:text-muted-foreground focus-visible:border-[#f58a2d] focus-visible:ring-ring/20"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="rounded-[8px] bg-orange-tint border border-orange-tint p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#f58a2d] mt-0.5 shrink-0" />
                  <div className="text-[13px] text-[#9a622f]">
                    <p className="font-semibold mb-1">Hvad sker der nu?</p>
                    <p>Den anden forælder skal først oprette en konto. Derefter kan de inviteres til husstanden.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep(5)}
                className="w-full text-[13px] text-muted-foreground py-2 transition-all active:scale-[0.98]"
              >
                Spring over — jeg er alene
              </button>
            </div>
          </motion.div>
        );

      case 5:
        if (data.familyType === 'same-household') {
          return (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-5"
            >
              <div className="text-center">
                <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Hverdagsopsætning</h2>
                <p className="text-[13px] text-muted-foreground">I får fokus på madplan, kalender, indkøb og opgaver.</p>
              </div>
              <div className="rounded-[8px] bg-orange-tint border border-orange-tint p-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#f58a2d] mt-0.5 shrink-0" />
                  <div className="text-[13px] text-[#9a622f]">
                    <p className="font-semibold mb-1">Tilpasset til samboende familie</p>
                    <p>Visning med sagsbehandler/professionel funktioner bliver skjult, så I kun ser det relevante til jeres hverdag.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Vælg samværsmodel</h2>
              <p className="text-[13px] text-muted-foreground">Du kan altid ændre dette senere</p>
            </div>
            <RadioGroup
              value={data.custodyPattern || ''}
              onValueChange={(v) => updateData('custodyPattern', v as CustodyPattern)}
              className="space-y-2.5"
            >
              {custodyPatterns.map((pattern) => (
                <Label
                  key={pattern.value}
                  htmlFor={pattern.value}
                  className={`flex items-center gap-3 p-3.5 rounded-[8px] border-2 cursor-pointer transition-all ${
                    data.custodyPattern === pattern.value
                      ? 'border-[#f58a2d] bg-orange-tint-light'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <RadioGroupItem value={pattern.value} id={pattern.value} />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[14px]">{pattern.label}</p>
                    <p className="text-[12px] text-muted-foreground">{pattern.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-5"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-tint flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-[#4caf50]" />
              </div>
              <h2 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1">Du er klar!</h2>
              <p className="text-[13px] text-muted-foreground">Her er et overblik over din opsætning</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-card/80 rounded-[8px] border border-border">
                <div className="w-10 h-10 rounded-full bg-orange-tint flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#f58a2d]" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[14px]">{data.parentName}</p>
                  <p className="text-[12px] text-muted-foreground">Forælder</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card/80 rounded-[8px] border border-border">
                <div className="w-10 h-10 rounded-full bg-orange-tint flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#f58a2d]" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[14px]">{data.childName}</p>
                  <p className="text-[12px] text-muted-foreground">Barn</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card/80 rounded-[8px] border border-border">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[14px]">
                    {data.familyType === 'same-household' ? 'Hverdagsmode' : `${data.custodyPattern} Ordning`}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {data.familyType === 'same-household' ? 'Samboende familie' : 'Samværsmodel'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* RibbonBanner baggrund */}
      <div className="absolute inset-0">
        <RibbonBanner />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl px-6 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">

              {/* Progress bar */}
              {step > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-muted-foreground">Trin {step} af 6</span>
                    <span className="text-[13px] font-semibold text-[#f58a2d] dark:text-[#f5a55d]">{Math.round((step / 6) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#f7a95c] to-[#f58a2d]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(step / 6) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Step content */}
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>

              {/* Navigation buttons */}
              {step > 0 && (
                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="flex-1 h-[48px] rounded-[8px] border-2 border-border bg-card/80 text-muted-foreground font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Tilbage
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`${step === 1 ? 'w-full' : 'flex-1'} h-[48px] rounded-[8px] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60`}
                    style={{
                      background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)',
                      boxShadow: '0 6px 20px rgba(245, 138, 45, 0.35)',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Opretter...
                      </>
                    ) : step === 6 ? (
                      'Start appen'
                    ) : (
                      <>
                        Fortsæt
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
