import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Heart, Users, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAppStore } from '@/store';
import type { Household, User } from '@/types';

interface HouseholdSetupProps {
  onComplete: () => void;
}

type FamilyType = 'co-parents-fixed' | 'co-parents-flex' | 'same-household' | 'blended';

const familyTypes: { value: FamilyType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'co-parents-fixed',
    label: 'Co-parents med fast ordning',
    description: 'Fast samværsplan som 7/7 eller 10/4',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    value: 'co-parents-flex',
    label: 'Co-parents med fleksibel ordning',
    description: 'Tilpasset plan efter behov',
    icon: <Clock className="w-5 h-5" />,
  },
  {
    value: 'same-household',
    label: 'Samboende familie',
    description: 'Samme husstand, travl hverdag',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    value: 'blended',
    label: 'Bonusfamilie',
    description: 'Flere børn og kalendere',
    icon: <Users className="w-5 h-5" />,
  },
];

const familyModeMap: Record<FamilyType, string> = {
  'co-parents-fixed': 'co_parenting',
  'co-parents-flex': 'co_parenting',
  'same-household': 'together',
  'blended': 'co_parenting',
};

interface ApiHouseholdResponse {
  id: string;
  name: string;
  familyMode: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      role: string;
      color: string;
    };
  }>;
  children: unknown[];
}

export function HouseholdSetup({ onComplete }: HouseholdSetupProps) {
  const { currentUser, setHousehold, hydrateFromServer } = useAppStore();
  const [selectedType, setSelectedType] = useState<FamilyType | null>(null);
  const [householdName, setHouseholdName] = useState(`${currentUser?.name || 'Min'}s Familie`);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedType) {
      toast.error('Vælg venligst en familietype');
      return;
    }

    setIsLoading(true);
    try {
      const familyMode = familyModeMap[selectedType];
      const raw = await api.post<ApiHouseholdResponse>('/api/household', {
        name: householdName.trim() || `${currentUser?.name}s Familie`,
        familyMode,
      });

      // Map to store format
      const household: Household = {
        id: raw.id,
        name: raw.name,
        familyMode: raw.familyMode as Household['familyMode'],
        members: raw.members.map((m) => m.user.id),
        children: [],
        subscription: { plan: 'free', billingModel: 'shared', status: 'active', startedAt: new Date().toISOString() },
      };

      const users: User[] = raw.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar ?? undefined,
        color: (m.user.color as User['color']) || 'warm',
        role: (m.user.role as User['role']) || 'parent',
      }));

      setHousehold(household);
      hydrateFromServer({ users });

      toast.success('Husstand oprettet!');
      onComplete();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Kunne ikke oprette husstand. Prøv igen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f4ef] via-[#f3f1ea] to-[#ece9e0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#f7a95c] to-[#f58a2d] flex items-center justify-center shadow-lg">
                <Home className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Opret din husstand</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Velkommen, {currentUser?.name}! Vælg din familietype for at komme i gang.
                </p>
              </div>
            </div>

            {/* Family type selection */}
            <div className="space-y-2">
              {familyTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedType === type.value
                      ? 'border-[#f7a95c] bg-orange-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedType === type.value ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900">{type.label}</div>
                    <div className="text-xs text-slate-500">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Household name */}
            <div className="space-y-2">
              <Label htmlFor="household-name">Husstandens navn</Label>
              <Input
                id="household-name"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Fx Jensens Familie"
                disabled={isLoading}
              />
            </div>

            {/* Create button */}
            <Button
              onClick={handleCreate}
              size="lg"
              className="w-full"
              disabled={isLoading || !selectedType}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opretter husstand...
                </>
              ) : (
                'Opret husstand'
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
