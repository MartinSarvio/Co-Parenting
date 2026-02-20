import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { getDefaultBillingModel } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Heart,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

type FamilyType = 'co-parents-fixed' | 'co-parents-flex' | 'same-household' | 'blended';
type CustodyPattern = '7/7' | '10/4' | 'custom';

interface OnboardingData {
  familyType: FamilyType | null;
  parentName: string;
  parentEmail: string;
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

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    familyType: null,
    parentName: '',
    parentEmail: '',
    childName: '',
    childBirthDate: '',
    otherParentEmail: '',
    custodyPattern: null,
  });
  
  const { setAuthenticated, setCurrentUser, addUser, addChild, setHousehold, addCustodyPlan } = useAppStore();

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !data.familyType) {
      toast.error('Vælg venligst en familietype');
      return;
    }
    if (step === 2 && (!data.parentName || !data.parentEmail)) {
      toast.error('Udfyld venligst alle felter');
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

  const completeOnboarding = () => {
    const familyMode: 'together' | 'blended' | 'co_parenting' = data.familyType === 'same-household'
      ? 'together'
      : data.familyType === 'blended'
        ? 'blended'
        : 'co_parenting';

    const derivedPartnerName = data.otherParentEmail
      ? data.otherParentEmail.split('@')[0].replace(/[._-]/g, ' ')
      : 'Forælder 2';

    // Create user
    const user = {
      id: 'u1',
      name: data.parentName,
      email: data.parentEmail,
      color: 'warm' as const,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.parentName}`,
      role: 'parent' as const,
    };

    const secondaryUser = {
      id: 'u2',
      name: derivedPartnerName
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      email: data.otherParentEmail || 'partner@example.com',
      color: 'cool' as const,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${derivedPartnerName || 'Partner'}`,
      role: 'parent' as const,
    };
    
    // Create child
    const child = {
      id: 'c1',
      name: data.childName,
      birthDate: data.childBirthDate,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.childName}&gender=female`,
      parent1Id: 'u1',
      parent2Id: secondaryUser.id,
    };
    
    // Create household
    const household = {
      id: 'h1',
      name: `${data.childName}'s Familie`,
      members: ['u1', 'u2'],
      children: ['c1'],
      familyMode,
      calendarSources: [],
      subscription: {
        plan: 'free' as const,
        billingModel: getDefaultBillingModel(familyMode),
        status: 'active' as const,
        startedAt: new Date().toISOString()
      },
      singleParentSupport: {
        evidenceVaultEnabled: false,
        autoArchiveReceipts: false,
        lawyerIds: [] as string[]
      },
      custodyPlanId: 'cp1',
    };
    
    // Create custody plan
    const selectedCustodyPattern = data.familyType === 'same-household'
      ? 'custom'
      : data.custodyPattern || '7/7';

    const custodyPlan = {
      id: 'cp1',
      name: data.familyType === 'same-household' ? 'Hverdagsplan' : `${selectedCustodyPattern} Ordning`,
      pattern: selectedCustodyPattern,
      startDate: new Date().toISOString().split('T')[0],
      swapDay: 4, // Friday
      swapTime: '18:00',
      parent1Weeks: 1,
      parent2Weeks: 1,
      parent1Days: data.familyType === 'same-household' ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6],
      parent2Days: data.familyType === 'same-household' ? [0, 1, 2, 3, 4, 5, 6] : [] as number[],
      childId: child.id,
    };
    
    setCurrentUser(user);
    addUser(user);
    addUser(secondaryUser);
    addChild(child);
    setHousehold(household);
    addCustodyPlan(custodyPlan);
    setAuthenticated(true);
    
    toast.success('Velkommen');
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Velkommen</h1>
              <p className="text-slate-600 max-w-sm mx-auto">
                Én sandhedskilde for hele familien. Overblik, struktur og mindre friktion.
              </p>
            </div>
            <div className="flex justify-center gap-4 text-sm text-slate-500">
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
            <Button 
              onClick={handleNext} 
              size="lg"
              className="w-full max-w-xs"
            >
              Kom i gang
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        );
        
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Vælg din familietype</h2>
              <p className="text-slate-600">Dette hjælper os med at tilpasse appen til dine behov</p>
            </div>
            <RadioGroup 
              value={data.familyType || ''} 
              onValueChange={(v) => updateData('familyType', v as FamilyType)}
              className="space-y-3"
            >
              {familyTypes.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    data.familyType === type.value 
                      ? 'border-[#f3c59d] bg-[#fff2e6]' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <div className={`p-2 rounded-lg ${data.familyType === type.value ? 'bg-[#f58a2d] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{type.label}</p>
                    <p className="text-sm text-slate-500">{type.description}</p>
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
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Fortæl om dig selv</h2>
              <p className="text-slate-600">Dine oplysninger gemmes sikkert</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Dit navn</Label>
                <Input
                  id="parentName"
                  value={data.parentName}
                  onChange={(e) => updateData('parentName', e.target.value)}
                  placeholder="F.eks. Sarah"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Din email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={data.parentEmail}
                  onChange={(e) => updateData('parentEmail', e.target.value)}
                  placeholder="sarah@example.com"
                  className="h-12"
                />
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
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tilføj dit barn</h2>
              <p className="text-slate-600">Du kan tilføje flere børn senere</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Barnets navn</Label>
                <Input
                  id="childName"
                  value={data.childName}
                  onChange={(e) => updateData('childName', e.target.value)}
                  placeholder="F.eks. Emma"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childBirthDate">Barnets fødselsdato</Label>
                <Input
                  id="childBirthDate"
                  type="date"
                  value={data.childBirthDate}
                  onChange={(e) => updateData('childBirthDate', e.target.value)}
                  className="h-12"
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
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Inviter den anden forælder</h2>
              <p className="text-slate-600">Send en invitation til at deltage i familien</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otherParentEmail">Den anden forælders email</Label>
                <Input
                  id="otherParentEmail"
                  type="email"
                  value={data.otherParentEmail}
                  onChange={(e) => updateData('otherParentEmail', e.target.value)}
                  placeholder="michael@example.com"
                  className="h-12"
                />
              </div>
              <Card className="bg-[#fff2e6] border-[#f3c59d]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-[#f58a2d] mt-0.5" />
                    <div className="text-sm text-[#9a622f]">
                      <p className="font-medium mb-1">Hvad sker der nu?</p>
                      <p>Den anden forælder modtager en email med invitation til at tilslutte sig familien. Indtil da kan du bruge appen alene.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Hverdagsopsætning</h2>
                <p className="text-slate-600">I får fokus på madplan, kalender, indkøb og opgaver.</p>
              </div>
              <Card className="bg-[#fff2e6] border-[#f3c59d]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-[#f58a2d] mt-0.5" />
                    <div className="text-sm text-[#9a622f]">
                      <p className="font-medium mb-1">Tilpasset til samboende familie</p>
                      <p>Visning med sagsbehandler/professionel funktioner bliver skjult, så I kun ser det relevante til jeres hverdag.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        }

        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Vælg samværsmodel</h2>
              <p className="text-slate-600">Du kan altid ændre dette senere</p>
            </div>
            <RadioGroup 
              value={data.custodyPattern || ''} 
              onValueChange={(v) => updateData('custodyPattern', v as CustodyPattern)}
              className="space-y-3"
            >
              {custodyPatterns.map((pattern) => (
                <Label
                  key={pattern.value}
                  htmlFor={pattern.value}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    data.custodyPattern === pattern.value 
                      ? 'border-[#f3c59d] bg-[#fff2e6]' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RadioGroupItem value={pattern.value} id={pattern.value} />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{pattern.label}</p>
                    <p className="text-sm text-slate-500">{pattern.description}</p>
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
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Du er klar!</h2>
              <p className="text-slate-600">Her er et overblik over din opsætning</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{data.parentName}</p>
                  <p className="text-sm text-slate-500">Forælder</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-[#fff2e6] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#f58a2d]" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{data.childName}</p>
                  <p className="text-sm text-slate-500">Barn</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {data.familyType === 'same-household' ? 'Hverdagsmode' : `${data.custodyPattern} Ordning`}
                  </p>
                  <p className="text-sm text-slate-500">
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
    <div className="min-h-screen bg-gradient-to-br from-[#f6f4ef] via-[#f3f1ea] to-[#ece9e0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-6">
          {/* Progress indicator */}
          {step > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Trin {step} af 6</span>
                <span className="text-sm font-medium text-[#b96424]">{Math.round((step / 6) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#f7a95c] to-[#f58a2d]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / 6) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
          
          {/* Content */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
          
          {/* Navigation buttons */}
          {step > 0 && (
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Tilbage
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`${step === 1 ? 'w-full' : 'flex-1'}`}
              >
                {step === 6 ? 'Start appen' : 'Fortsæt'}
                {step !== 6 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
