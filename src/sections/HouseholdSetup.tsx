import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Heart, Users, Home, Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { logoutUser } from '@/lib/auth';
import { useAppStore } from '@/store';
import { RibbonBanner } from '@/components/custom/RibbonBanner';
import type { Household, User } from '@/types';

interface HouseholdSetupProps {
  onComplete: () => void;
  onBack?: () => void;
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

export function HouseholdSetup({ onComplete, onBack }: HouseholdSetupProps) {
  const { currentUser, setHousehold, hydrateFromServer, logout } = useAppStore();
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
    <div
      className="fixed inset-0 flex flex-col"
      style={{ touchAction: 'none', overscrollBehavior: 'none', overflow: 'hidden' }}
    >
      {/* Ribbon banner baggrund */}
      <div className="absolute inset-0">
        <RibbonBanner />
      </div>

      {/* Content overlay */}
      <div
        className="relative z-10 flex items-center justify-center h-full"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'max(env(safe-area-inset-left), 24px)',
          paddingRight: 'max(env(safe-area-inset-right), 24px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#f7a95c] to-[#f58a2d] flex items-center justify-center shadow-lg">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#2f2f2d]">Opret din husstand</h1>
                  <p className="text-[#9a978f] text-[13px] mt-1">
                    Vælg din familietype for at komme i gang.
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
                        ? 'border-[#f7a95c] bg-[#fff7ef] shadow-sm'
                        : 'border-[#e5e3dc] bg-white/80 hover:border-[#d5d3cc]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === type.value ? 'bg-[#fff0e0] text-[#e8773f]' : 'bg-[#f2f1ed] text-[#9a978f]'}`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#2f2f2d]">{type.label}</div>
                      <div className="text-xs text-[#9a978f]">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Household name */}
              <div className="space-y-2">
                <Label htmlFor="household-name" className="text-[#5f5d56]">Husstandens navn</Label>
                <Input
                  id="household-name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Fx Jensens Familie"
                  disabled={isLoading}
                  className="h-[50px] text-[15px] bg-white/80 border-[#e5e3dc] rounded-xl placeholder:text-[#c4c1b8] focus-visible:border-[#f58a2d] focus-visible:ring-[#f58a2d]/20"
                />
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={isLoading || !selectedType}
                className="w-full h-[48px] rounded-xl text-white font-semibold text-[15px] tracking-[-0.01em] transition-all duration-200 disabled:opacity-60 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)',
                  boxShadow: '0 6px 20px rgba(245, 138, 45, 0.35)',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Opretter husstand...
                  </span>
                ) : (
                  'Opret husstand'
                )}
              </button>

              {/* Tilbage-knap */}
              <button
                onClick={() => {
                  logoutUser();
                  logout();
                  onBack?.();
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 text-[13px] text-[#9a978f] py-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Tilbage til login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
