import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Funktioner', href: '#features' },
    { label: 'Sådan virker det', href: '#how-it-works' },
    { label: 'Priser', href: '#pricing' },
    { label: 'Om os', href: '#about' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md'
            : 'bg-transparent'
        }`}
        style={{ 
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        <div className="container-huska">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Huska
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <a href="#login" className="nav-link">
                Log ind
              </a>
              <a href="#download" className="btn-primary">
                Hent appen
              </a>
            </div>

            {/* Mobil menuknap */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Luk menu' : 'Åbn menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobil menu */}
      <div
        className={`fixed inset-0 z-[99] bg-white transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-2xl font-medium"
              style={{ fontFamily: 'var(--font-heading)' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#login"
            className="text-2xl font-medium mt-4"
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Log ind
          </a>
          <a
            href="#download"
            className="btn-primary mt-4"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Hent appen
          </a>
        </div>
      </div>
    </>
  );
}