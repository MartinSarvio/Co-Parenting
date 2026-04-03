import { Mail, Heart } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    navigation: [
      { label: 'Funktioner', href: '#features' },
      { label: 'Sådan virker det', href: '#how-it-works' },
      { label: 'Priser', href: '#pricing' },
      { label: 'Om os', href: '#about' },
    ],
    info: [
      { label: 'Kontakt', href: '#contact' },
      { label: 'Privatlivspolitik', href: '#privacy' },
      { label: 'Vilkår og betingelser', href: '#terms' },
    ],
  };

  return (
    <footer className="bg-[var(--color-dark)] text-white py-16 lg:py-20">
      <div className="container-huska">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Huska
              </span>
            </div>
            <p className="text-white/70 max-w-sm mb-6">
              Koordinér hverdagen sammen. Én sandhedskilde for hele familien med overblik, struktur og mindre friktion.
            </p>
            <a
              href="mailto:kontakt@huska.dk"
              className="inline-flex items-center gap-2 text-white/70 hover:text-[var(--color-accent)] transition-colors"
            >
              <Mail className="w-4 h-4" />
              kontakt@huska.dk
            </a>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Navigation
            </h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Info
            </h4>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bundlinje */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © 2026 Huska. Alle rettigheder forbeholdes.
          </p>
          <p className="text-white/50 text-sm flex items-center gap-1">
            Lavet med <Heart className="w-4 h-4 text-red-400 fill-red-400" /> i Danmark
          </p>
        </div>
      </div>
    </footer>
  );
}