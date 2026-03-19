import { useState } from 'react';
import { supabase, supabaseMissing } from '@/lib/supabase';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function WebLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (supabaseMissing) {
        setError('Login er midlertidigt utilgængelig. Prøv igen senere.');
        setLoading(false);
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Forkert email eller adgangskode');
        } else {
          setError(authError.message);
        }
      } else {
        window.location.hash = '#admin';
      }
    } catch {
      setError('Noget gik galt. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero image (hidden on mobile) */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <img
          src="/images/kalender-photo.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <div className="flex items-center gap-3 mb-4">
            <img src="/huska-logo.svg" alt="Huska" className="h-10 w-10 rounded-xl shadow-md" />
            <span className="text-xl font-bold text-white tracking-tight">Huska</span>
          </div>
          <p className="text-white/90 text-lg font-semibold leading-snug max-w-sm">
            Co-parenting gjort nemt.<br />
            Samarbejd om børnenes hverdag.
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative overflow-hidden px-4 bg-white">

        {/* Back button */}
        <a
          href="#"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-[#78766d] hover:text-[#2f2f2f] transition-colors z-10"
        >
          <ArrowLeft size={18} />
          Tilbage
        </a>

        {/* Login card */}
        <div className="relative w-full max-w-md animate-fadeIn z-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="/huska-logo.svg" alt="Huska" className="h-12 w-12 rounded-2xl shadow-md" />
            <span className="text-2xl font-bold text-[#2f2f2f] tracking-tight">Huska</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#2f2f2f]">Log ind</h1>
              <p className="text-sm text-[#78766d] mt-1">Velkommen tilbage til Huska</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b5b3ab]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.dk"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#e5e3dc] bg-white/80 text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#f58a2d]/30 focus:border-[#f58a2d]/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Adgangskode</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b5b3ab]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-[#e5e3dc] bg-white/80 text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#f58a2d]/30 focus:border-[#f58a2d]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b5b3ab] hover:text-[#78766d] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#5f5d56] cursor-pointer">
                  <input type="checkbox" className="rounded border-[#e5e3dc] accent-[#f58a2d]" />
                  Husk mig
                </label>
                <a href="#" className="text-[#f58a2d] hover:text-[#e8773f] font-medium transition-colors">
                  Glemt adgangskode?
                </a>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-[#f58a2d]/25 hover:shadow-xl hover:shadow-[#f58a2d]/30 disabled:opacity-60 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Log ind
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-[#b5b3ab] mt-6">
            Har du ikke en konto?{' '}
            <a href="#" className="text-[#f58a2d] hover:text-[#e8773f] font-medium transition-colors">
              Download appen
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
