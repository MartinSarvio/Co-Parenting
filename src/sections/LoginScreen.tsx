import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Clock, Heart, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginUser } from '@/lib/auth';
import { loadInitialData } from '@/lib/dataSync';
import { useAppStore } from '@/store';
import { ApiError } from '@/lib/api';

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
        // Data load failure is non-fatal — user can still use the app
        console.warn('Kunne ikke hente data fra server');
      }

      setAuthenticated(true);
      toast.success(`Velkommen tilbage, ${user.name}!`);
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
    <div className="min-h-screen bg-gradient-to-br from-[#f6f4ef] via-[#f3f1ea] to-[#ece9e0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#f7a95c] to-[#f58a2d] flex items-center justify-center shadow-xl">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Log ind</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Velkommen tilbage til Familiekoordinering
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.dk"
                    className="h-12 pl-10"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Adgangskode</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Din adgangskode"
                    className="h-12 pl-10"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
            </div>

            {/* Login button */}
            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logger ind...
                </>
              ) : (
                'Log ind'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Eller</span>
              </div>
            </div>

            {/* Register link */}
            <Button
              variant="outline"
              onClick={onSwitchToRegister}
              className="w-full"
              disabled={isLoading}
            >
              Opret ny konto
            </Button>

            {/* Features */}
            <div className="flex justify-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Sikkert</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Tidsbesparende</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>Gratis</span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
