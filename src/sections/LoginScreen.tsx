import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginUser } from '@/lib/auth';
import { loadInitialData } from '@/lib/dataSync';
import { useAppStore } from '@/store';
import { ApiError } from '@/lib/api';
import { RibbonBanner } from '@/components/custom/RibbonBanner';
import { initPushNotifications } from '@/lib/pushNotifications';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setCurrentUser, setAuthenticated, hydrateFromServer } = useAppStore();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Udfyld venligst email og adgangskode');
      return;
    }

    setIsLoading(true);
    try {
      const { user, token } = await loginUser({ email, password });
      setCurrentUser(user);

      // Load initial data — if this fails, restore the token since login itself succeeded
      try {
        const data = await loadInitialData();
        hydrateFromServer(data);
      } catch {
        console.warn('Kunne ikke hente data fra server — fortsætter alligevel');
        // Restore token in case loadInitialData cleared it on a 401
        if (token && !localStorage.getItem('auth-token')) {
          localStorage.setItem('auth-token', token);
        }
      }

      setAuthenticated(true);
      toast.success(`Velkommen, ${user.name}!`);
      initPushNotifications().catch(console.warn);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Noget gik galt. Prøv igen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Ribbon banner — fills entire background */}
      <div className="absolute inset-0">
        <RibbonBanner />
      </div>

      {/* Content overlay — centered */}
      <div className="relative z-10 flex items-center justify-center h-full px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
          >
            {/* App branding */}
            <div className="text-center mb-7">
              <h1 className="text-[2rem] font-bold text-[#2f2f2d] tracking-tight">
                Hverdag
              </h1>
              <p className="text-[0.85rem] text-[#9a978f] mt-1">
                Koordiner hverdagen sammen
              </p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#b5b2a8] z-10" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  className="h-[50px] pl-11 text-[15px] bg-white/80 border-[#e5e3dc] rounded-xl placeholder:text-[#c4c1b8] focus-visible:border-[#f58a2d] focus-visible:ring-[#f58a2d]/20"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#b5b2a8] z-10" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Adgangskode"
                  className="h-[50px] pl-11 text-[15px] bg-white/80 border-[#e5e3dc] rounded-xl placeholder:text-[#c4c1b8] focus-visible:border-[#f58a2d] focus-visible:ring-[#f58a2d]/20"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* Login button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-[50px] rounded-xl text-white font-semibold text-[1rem] tracking-[-0.01em] transition-all duration-200 disabled:opacity-60 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)',
                  boxShadow: '0 6px 20px rgba(245, 138, 45, 0.35)',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logger ind...
                  </span>
                ) : (
                  'Log ind'
                )}
              </button>

              {/* Register link */}
              <div className="text-center pt-2">
                <button
                  onClick={onSwitchToRegister}
                  disabled={isLoading}
                  className="text-[13px] text-[#9a978f]"
                >
                  Har du ikke en konto?{' '}
                  <span className="font-semibold text-[#f58a2d]">Opret konto</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
