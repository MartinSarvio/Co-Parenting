import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Heart, Users, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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

export function HouseholdSetup({ onComplete }: HouseholdSetupProps) {
  const { currentUser, setHousehold, hydrateFromServer } = useAppStore();
  const [selectedType, setSelectedType] = useState<FamilyType | null>(null);
  const [householdName, setHouseholdName] = useState(`${currentUser?.name || 'Min'}s Familie`);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedType || !currentUser) {
      toast.error('Vælg venligst en familietype');
      return;
    }

    setIsLoading(true);
    try {
      const familyMode = familyModeMap[selectedType];
      const name = householdName.trim() || `${currentUser.name}s Familie`;

      // Create household
      const { data: householdRow, error: hhErr } = await supabase
        .from('households')
        .insert({ name, family_mode: familyMode })
        .select()
        .single();
      if (hhErr || !householdRow) throw new Error(hhErr?.message || 'Kunne ikke oprette husstand');

      // Add current user as member
      await supabase.from('household_members').insert({
        user_id: currentUser.id,
        household_id: householdRow.id,
        role: 'parent',
      });

      // Map to store format
      const household: Household = {
        id: householdRow.id,
        name: householdRow.name,
        familyMode: familyMode as Household['familyMode'],
        members: [currentUser.id],
        children: [],
        subscription: { plan: 'free', billingModel: 'shared', status: 'active', startedAt: new Date().toISOString() },
      };

      const users: User[] = [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        color: currentUser.color || 'warm',
        role: currentUser.role || 'parent',
      }];

      setHousehold(household);
      hydrateFromServer({ users });

      toast.success('Husstand oprettet!');
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke oprette husstand. Prøv igen.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f4ef] via-[#f3f1ea] to-[#ece9e0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-[8px] bg-gradient-to-br from-[#f7a95c] to-[#f58a2d] flex items-center justify-center shadow-lg">
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
                  className={`w-full flex items-center gap-3 p-3 rounded-[8px] border transition-all text-left ${
                    selectedType === type.value
                      ? 'border-[#f7a95c] bg-orange-50 shadow-sm'
                      : 'border-slate-200 bg-card hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-[8px] ${selectedType === type.value ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
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
