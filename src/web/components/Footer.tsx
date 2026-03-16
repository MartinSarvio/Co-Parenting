import { useState } from 'react';
import { Heart, Send, Facebook, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-[#1a1a1a] text-white/80 overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/huska-logo.svg" alt="Huska" className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-bold text-white tracking-tight">Huska</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Koordinér hverdagen sammen. Én sandhedskilde for hele familien
              med overblik, struktur og mindre friktion.
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-5">
              {[
                { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  title={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-4">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#funktioner" className="text-white/50 hover:text-white transition-colors">Funktioner</a></li>
              <li><a href="#hvordan" className="text-white/50 hover:text-white transition-colors">Sådan virker det</a></li>
              <li><a href="#om" className="text-white/50 hover:text-white transition-colors">Om os</a></li>
              <li><a href="#login" className="text-white/50 hover:text-white transition-colors">Log ind</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-4">Info</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="text-white/50">kontakt@huska.dk</li>
              <li><a href="#privatlivspolitik" className="text-white/50 hover:text-white transition-colors">Privatlivspolitik</a></li>
              <li><a href="#kontakt" className="text-white/50 hover:text-white transition-colors">Kontakt</a></li>
              <li><a href="#vilkar" className="text-white/50 hover:text-white transition-colors">Vilkår og betingelser</a></li>
              <li><a href="#partner" className="text-white/50 hover:text-white transition-colors">For kommuner & partnere</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-4">Nyhedsbrev</h3>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">
              Få tips til familien og nyheder om Huska.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <Heart size={14} className="fill-[#10b981]" />
                Tak for din tilmelding!
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  required
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 rounded-xl bg-white text-[#1a1a1a] font-medium transition-all duration-200 hover:bg-white/90 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">
            &copy; {new Date().getFullYear()} Huska. Alle rettigheder forbeholdes.
          </p>
          <p className="text-[12px] text-white/30 flex items-center gap-1">
            Lavet med <Heart size={11} className="text-white/40 fill-white/40" /> i Danmark
          </p>
        </div>
      </div>
    </footer>
  );
}
