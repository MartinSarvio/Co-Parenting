import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Funktioner', href: '#funktioner' },
    { label: 'Sådan virker det', href: '#hvordan' },
    { label: 'Om os', href: '#om' },
    { label: 'Kontakt', href: '#kontakt' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-sm' : 'bg-white/90'} border-b border-[#e5e5e5]/40`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + brand name */}
          <a href="/web.html" className="flex items-center gap-3 group">
            <img
              src="/huska-logo.svg"
              alt="Huska"
              className="h-10 w-10 rounded-2xl group-hover:shadow-md transition-shadow"
            />
            <span className="text-[18px] font-bold text-[#1a1a1a] tracking-tight">Huska</span>
          </a>

          {/* Desktop nav — center */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link, i) => (
              <span key={link.href} className="flex items-center gap-1.5">
                <a
                  href={link.href}
                  className="text-[14px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors px-2.5 py-1"
                >
                  {link.label}
                </a>
                {i < navLinks.length - 1 && (
                  <span className="text-[#d1d5db] text-xs select-none">·</span>
                )}
              </span>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#admin"
              className="text-[14px] font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
            >
              Log ind
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white bg-[#1a1a1a] rounded-full hover:bg-[#333] transition-colors duration-200"
            >
              Hent appen
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#4a4a4a] hover:bg-[#f0f0f0] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#e5e5e5] pt-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-[15px] font-medium text-[#4a4a4a] hover:text-[#1a1a1a] rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#admin"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-[15px] font-medium text-[#6b7280]"
            >
              Log ind
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="block mx-3 mt-2 text-center px-5 py-3 text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-full"
            >
              Hent appen
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
