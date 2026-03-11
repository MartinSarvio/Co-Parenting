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
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-white/60 backdrop-blur-md'} border-b border-[#e5e3dc]/60`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/web.html" className="flex items-center gap-2.5 group">
            <img src="/icon-192.png" alt="Hverdag" className="h-9 w-9 rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
            <span className="text-xl font-bold text-[#2f2f2f] tracking-tight">Hverdag</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#5f5d56] hover:text-[#2f2f2f] relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#f58a2d] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#admin"
              className="text-xs text-[#b5b3ab] hover:text-[#78766d] transition-colors"
            >
              Admin
            </a>
            <a
              href="#funktioner"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white rounded-full hover:scale-[1.03] hover:shadow-lg hover:shadow-[#f58a2d]/25 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
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
          <div className="md:hidden pb-4 border-t border-[#e5e3dc] pt-3 space-y-1">
            {navLinks.map((link) => (
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
              href="#admin"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-xs text-[#b5b3ab]"
            >
              Admin
            </a>
            <a
              href="#funktioner"
              onClick={() => setMobileOpen(false)}
              className="block mx-3 mt-3 text-center px-5 py-3 text-[15px] font-semibold text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
            >
              Hent appen
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
