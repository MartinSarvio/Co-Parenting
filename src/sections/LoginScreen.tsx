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
      const { user } = await loginUser({ email, password });
      setCurrentUser(user);

      // Load all data from server
      try {
        const data = await loadInitialData();
        hydrateFromServer(data);
      } catch {
        console.warn('Kunne ikke hente data fra server');
      }

      setAuthenticated(true);
      toast.success(`Velkommen, ${user.name}!`);

      // Initialize push notifications (non-blocking)
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
    <div className="min-h-[100svh] flex flex-col relative overflow-hidden bg-[#f6f4ef]">
      {/* Ribbon banner — top section */}
      <div className="relative flex-shrink-0" style={{ height: '46svh' }}>
        <RibbonBanner />

        {/* Gradient fade at bottom for smooth transition */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #f6f4ef 0%, #f6f4ef88 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Login card — slides up from bottom */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 -mt-8 relative z-10"
      >
        <div
          className="bg-white rounded-t-[2rem] shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-6 pt-8 min-h-full"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
        >
          {/* App branding */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-center mb-8"
          >
            <h1 className="text-[1.75rem] font-bold text-[#2f2f2d] tracking-tight">
              Hverdag
            </h1>
            <p className="text-sm text-[#8a877f] mt-1">
              Koordiner hverdagen sammen
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="space-y-4 max-w-sm mx-auto"
          >
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#b5b2a8]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.dk"
                className="h-[52px] pl-11 text-base bg-[#f9f8f5] border-[#e8e6df] rounded-2xl placeholder:text-[#c4c1b8] focus-visible:border-[#f58a2d] focus-visible:ring-[#f58a2d]/20"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#b5b2a8]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Adgangskode"
                className="h-[52px] pl-11 text-base bg-[#f9f8f5] border-[#e8e6df] rounded-2xl placeholder:text-[#c4c1b8] focus-visible:border-[#f58a2d] focus-visible:ring-[#f58a2d]/20"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-[52px] rounded-2xl text-white font-semibold text-[1.05rem] tracking-[-0.01em] transition-all duration-200 disabled:opacity-60 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)',
                boxShadow: '0 8px 24px rgba(245, 138, 45, 0.3), 0 2px 8px rgba(245, 138, 45, 0.15)',
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
                className="text-sm text-[#8a877f] hover:text-[#f58a2d] transition-colors duration-200"
              >
                Har du ikke en konto?{' '}
                <span className="font-semibold text-[#f58a2d]">Opret konto</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
