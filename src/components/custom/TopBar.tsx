import { useAppStore } from '@/store';
import { getParentColor } from '@/lib/utils';
import { Bell, Settings, ChevronDown, Briefcase, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logoutUser } from '@/lib/auth';
export function TopBar() {
  const { currentUser, children, notifications, isProfessionalView, setProfessionalView, household, setActiveTab, logout } = useAppStore();

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const currentChild = children[0];
  const allowProfessionalTools = household?.familyMode !== 'together';
  const showProfessionalView = isProfessionalView && allowProfessionalTools;
  const modeLabel = household?.familyMode === 'together'
    ? 'Samboende'
    : household?.familyMode === 'single_parent'
      ? 'Enlig'
      : household?.familyMode === 'blended'
        ? 'Bonus'
        : 'Co-parenting';
  const billingLabel = household?.subscription?.billingModel === 'shared' ? 'Delt abo' : 'Separat abo';

  return (
    <header className="safe-area-pt fixed inset-x-0 top-0 z-50 border-b border-[#d8d7cf] bg-[#f2f1ed]">
      <div className="mx-auto grid w-full max-w-[430px] grid-cols-[auto_1fr_auto] items-center gap-2 px-4 pb-2.5 pt-2">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-semibold text-[#30302d]">
            {showProfessionalView ? 'Professionel' : 'Hverdag'}
          </span>
        </div>

        <div className="flex min-w-0 justify-center">
          {!showProfessionalView && currentChild && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="mx-auto flex h-9 max-w-[170px] min-w-0 items-center gap-2 rounded-full border border-[#d8d7cf] bg-[#faf9f6] px-2.5 text-[#343430] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f3f2ee] sm:max-w-[190px]"
                  aria-label={`Valgt barn: ${currentChild.name}. Klik for at skifte`}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={currentChild.avatar} />
                    <AvatarFallback className="bg-[#ecebe6] text-xs text-[#4d4c47]">
                      {currentChild.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{currentChild.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#8a887f]" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Vælg barn</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {children.map(child => (
                  <DropdownMenuItem key={child.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback className="text-xs">{child.name[0]}</AvatarFallback>
                    </Avatar>
                    {child.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showProfessionalView && allowProfessionalTools && (
            <Badge variant="outline" className="h-8 border-[#d8d7cf] bg-[#f8f7f3] px-3 text-[#41403c]">
              <Briefcase className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Sagsbehandler
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-self-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#d7d5ce] bg-[#faf9f6] text-[#4a4944] transition-colors hover:bg-[#f1f0ea]"
                aria-label={unreadNotifications > 0 ? `${unreadNotifications} ulæste notifikationer` : 'Notifikationer'}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f58a2d]" aria-hidden="true" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-white border-[#d8d7cf]">
              <DropdownMenuLabel>Notifikationer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadNotifications === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Ingen nye notifikationer
                </div>
              ) : (
                notifications.filter(n => !n.read).map(n => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start py-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-slate-500">{n.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7d5ce] bg-[#faf9f6] transition-colors hover:bg-[#f1f0ea]"
                aria-label={`Brugermenu for ${currentUser?.name ?? 'bruger'}`}
              >
                <Avatar className="h-8 w-8 border border-white shadow-sm">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback
                    className="text-sm"
                    style={{
                      backgroundColor: currentUser ? getParentColor(currentUser.color) + '30' : undefined,
                      color: currentUser ? getParentColor(currentUser.color) : undefined
                    }}
                  >
                    {currentUser?.name[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="font-medium">{currentUser?.name}</span>
                  <span className="text-xs text-slate-500">{currentUser?.email}</span>
                  <span className="mt-1 text-xs text-[#6e6a61]">
                    {modeLabel} · {billingLabel}
                  </span>
                  {currentUser?.role === 'professional' && (
                    <span className="mt-1 text-xs text-[#6e6a61]">{currentUser.organization}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {allowProfessionalTools && (
                <DropdownMenuItem
                  onClick={() => setProfessionalView(!isProfessionalView)}
                  className="flex items-center gap-2"
                >
                  {isProfessionalView ? (
                    <>
                      <User className="h-4 w-4" aria-hidden="true" />
                      Skift til forældrevisning
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                      Skift til professionel visning
                    </>
                  )}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Indstillinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-[#b56522]"
                onClick={() => {
                  logoutUser();
                  logout();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log ud
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
