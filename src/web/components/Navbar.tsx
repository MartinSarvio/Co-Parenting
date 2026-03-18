import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  Smartphone,
  Calendar,
  CheckSquare,
  UtensilsCrossed,
  MessageCircle,
  Wallet,
  CalendarHeart,
} from 'lucide-react';

const funktionerLinks = [
  { label: 'Web App', href: '#webapp', icon: Globe, color: '#f58a2d', desc: 'Fuld adgang i browseren' },
  { label: 'Mobil app', href: '#mobilapp', icon: Smartphone, color: '#2f2f2f', desc: 'Altid ved hånden' },
  { label: 'Samvær', href: '#samvaer', icon: Calendar, color: '#f58a2d', desc: '7/7, 10/4 og fleksibel' },
  { label: 'Opgaver', href: '#opgaver', icon: CheckSquare, color: '#f43f5e', desc: 'Fordel familiens to-dos' },
  { label: 'Mad & hjem', href: '#madhjem', icon: UtensilsCrossed, color: '#06b6d4', desc: 'Madplan og indkøb' },
  { label: 'Kommunikation', href: '#kommunikation', icon: MessageCircle, color: '#8b5cf6', desc: 'Struktureret dialog' },
  { label: 'Udgifter', href: '#udgifter', icon: Wallet, color: '#10b981', desc: 'Del udgifter retfærdigt' },
  { label: 'Kalender', href: '#kalender', icon: CalendarHeart, color: '#3b82f6', desc: 'Fælles overblik' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    const handler = () => { setDropdownOpen(false); setMobileOpen(false); };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const otherLinks = [
    { label: 'Sådan virker det', href: '#hvordan' },
    { label: 'Priser', href: '#priser' },
    { label: 'Om os', href: '#om' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl ${scrolled ? 'bg-white/70 shadow-lg shadow-black/[0.04] border-b border-white/40' : 'bg-white/50 border-b border-[#e5e3dc]/40'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/web.html" className="flex items-center gap-2.5 group">
            <img src="/huska-logo.svg" alt="Huska" className="h-9 w-9 rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
            <span className="text-xl font-bold text-[#2f2f2f] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Huska</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {/* Funktioner dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 text-sm font-medium text-[#5f5d56] hover:text-[#2f2f2f] relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#2F6BFF] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left transition-colors"
              >
                Funktioner
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/[0.08] grid grid-cols-2 gap-1 animate-fadeIn">
                  {funktionerLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f2f1ed]/80 transition-colors group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: `${item.color}12` }}
                      >
                        <item.icon size={18} style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#2f2f2f]">{item.label}</p>
                        <p className="text-[11px] text-[#78766d]">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {otherLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#5f5d56] hover:text-[#2f2f2f] relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#2F6BFF] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#login"
              className="text-sm font-medium text-[#5f5d56] hover:text-[#2f2f2f] transition-colors"
            >
              Log ind
            </a>
            <a
              href="#funktioner"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white rounded-full hover:shadow-lg hover:shadow-[#2F6BFF]/25 transition-shadow duration-200"
              style={{ background: '#2F6BFF' }}
            >
              Hent appen
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#5f5d56] hover:bg-[#f2f1ed] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#e5e3dc] pt-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {/* Funktioner expandable */}
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-[15px] font-medium text-[#5f5d56] hover:text-[#2f2f2f] rounded-lg hover:bg-[#f2f1ed] transition-colors"
            >
              Funktioner
              <ChevronDown size={16} className={`transition-transform duration-200 ${mobileExpanded ? 'rotate-180' : ''}`} />
            </button>

            {mobileExpanded && (
              <div className="pl-4 space-y-0.5">
                {funktionerLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#f2f1ed] transition-colors"
                  >
                    <item.icon size={16} style={{ color: item.color }} />
                    <span className="text-[14px] text-[#5f5d56]">{item.label}</span>
                  </a>
                ))}
              </div>
            )}

            {otherLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-[15px] font-medium text-[#5f5d56] hover:text-[#2f2f2f] rounded-lg hover:bg-[#f2f1ed] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-[15px] font-medium text-[#5f5d56] hover:text-[#2f2f2f] rounded-lg hover:bg-[#f2f1ed] transition-colors"
            >
              Log ind
            </a>
            <a
              href="#funktioner"
              onClick={() => setMobileOpen(false)}
              className="block mx-3 mt-3 text-center px-5 py-3 text-[15px] font-semibold text-white rounded-full"
              style={{ background: '#2F6BFF' }}
            >
              Hent appen
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
