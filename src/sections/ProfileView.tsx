import { useAppStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, MapPin, Settings } from 'lucide-react';

/* ─── Demo profile data ─── */

interface DemoProfile {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  email?: string;
  phone?: string;
  city?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
}

const DEMO_PROFILES: Record<string, DemoProfile> = {
  'user-line': {
    id: 'user-line',
    name: 'Line M.',
    avatar: '',
    bio: 'Mor til to dejlige børn. Interesseret i samværsplanlægning og familieliv.',
    email: 'line.m@email.dk',
    phone: '+45 12 34 56 78',
    city: 'København',
    showEmail: true,
    showPhone: false,
    showAddress: true,
  },
  'user-thomas': {
    id: 'user-thomas',
    name: 'Thomas K.',
    avatar: '',
    bio: 'Far til tre. Deler gerne erfaringer om hverdagen med delebørn.',
    email: 'thomas.k@email.dk',
    city: 'Aarhus',
    showEmail: true,
    showPhone: false,
    showAddress: true,
  },
  'user-sofie': {
    id: 'user-sofie',
    name: 'Sofie J.',
    avatar: '',
    bio: 'Glad mor og dagplejer. Elsker at hjælpe andre forældre.',
    email: 'sofie.j@email.dk',
    phone: '+45 87 65 43 21',
    city: 'Odense',
    showEmail: true,
    showPhone: true,
    showAddress: true,
  },
  'user-anders': {
    id: 'user-anders',
    name: 'Anders P.',
    avatar: '',
    bio: 'Far til en dreng på 5. Ny i skilsmisse-verdenen.',
    city: 'Aalborg',
    showEmail: false,
    showPhone: false,
    showAddress: true,
  },
};

export function ProfileView() {
  const { viewProfileUserId, currentUser, setActiveTab } = useAppStore();

  const isOwnProfile = viewProfileUserId === currentUser?.id || viewProfileUserId === 'self';

  // Try to find demo profile, or build from currentUser for own profile
  let profile: DemoProfile | null = null;

  if (isOwnProfile && currentUser) {
    profile = {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar || '',
      bio: currentUser.profileVisibility?.bio,
      email: currentUser.email,
      phone: currentUser.phone,
      city: currentUser.address?.city,
      showEmail: currentUser.profileVisibility?.showEmail ?? false,
      showPhone: currentUser.profileVisibility?.showPhone ?? false,
      showAddress: currentUser.profileVisibility?.showAddress ?? false,
    };
  } else if (viewProfileUserId) {
    profile = DEMO_PROFILES[viewProfileUserId] || null;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[14px] text-muted-foreground">Profil ikke fundet</p>
      </div>
    );
  }

  return (
    <div className="-mx-3 sm:-mx-4">
      {/* Profile header */}
      <div className="bg-card px-4 py-8 flex flex-col items-center gap-3">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback className="bg-secondary text-muted-foreground text-2xl font-bold">
            {profile.name[0]}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-[20px] font-bold text-foreground">{profile.name}</h2>
        {profile.bio && (
          <p className="text-[14px] text-muted-foreground text-center leading-relaxed max-w-[280px]">{profile.bio}</p>
        )}
      </div>

      {/* Contact info */}
      <div className="mt-[6px] bg-card">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1.5">Kontaktinfo</p>

        {profile.showEmail && profile.email && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-[#f58a2d]/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-[#f58a2d]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Email</p>
              <p className="text-[14px] text-foreground">{profile.email}</p>
            </div>
          </div>
        )}

        {profile.showPhone && profile.phone && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-[#f58a2d]/10 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-[#f58a2d]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Telefon</p>
              <p className="text-[14px] text-foreground">{profile.phone}</p>
            </div>
          </div>
        )}

        {profile.showAddress && profile.city && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#f58a2d]/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-[#f58a2d]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">By</p>
              <p className="text-[14px] text-foreground">{profile.city}</p>
            </div>
          </div>
        )}

        {!profile.showEmail && !profile.showPhone && !profile.showAddress && (
          <p className="px-4 py-4 text-[13px] text-muted-foreground text-center">
            Denne bruger deler ikke kontaktoplysninger
          </p>
        )}
      </div>

      {/* Edit profile button (own profile only) */}
      {isOwnProfile && (
        <div className="mt-[6px] bg-card px-4 py-4">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-[14px] font-semibold text-muted-foreground hover:bg-card transition-colors"
          >
            <Settings className="h-4 w-4" />
            Rediger profil
          </button>
        </div>
      )}
    </div>
  );
}
