import { Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const productLinks = [
    { label: 'Samværsplan', href: '#funktioner' },
    { label: 'Kalender', href: '#funktioner' },
    { label: 'Kommunikation', href: '#funktioner' },
    { label: 'Udgifter', href: '#funktioner' },
    { label: 'Alle funktioner', href: '#funktioner' },
  ];

  const companyLinks = [
    { label: 'Om os', href: '#om' },
    { label: 'Kontakt', href: '#kontakt' },
    { label: 'Privatlivspolitik', href: '#privatlivspolitik' },
    { label: 'Vilkår og betingelser', href: '#' },
  ];

  return (
    <footer className="bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/huska-logo.svg" alt="Huska" className="h-10 w-10 rounded-2xl" />
              <span className="text-[18px] font-bold text-white tracking-tight">Huska</span>
            </div>
            <p className="text-[13px] text-white/35 max-w-[240px] leading-relaxed">
              Koordinér hverdagen sammen. Én sandhedskilde for hele familien.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Instagram size={15} className="text-white/40" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Twitter size={15} className="text-white/40" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Linkedin size={15} className="text-white/40" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Produkt</h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-white/35 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Virksomhed</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-white/35 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-4">Kontakt</h3>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <a href="mailto:kontakt@huska.dk" className="text-white/35 hover:text-white transition-colors">
                  kontakt@huska.dk
                </a>
              </li>
              <li className="text-white/25">Danmark</li>
            </ul>

            <div className="mt-6">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-[12px] font-semibold text-white/60 rounded-full border border-white/10 hover:border-white/25 hover:text-white transition-colors"
              >
                Hent appen
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/20">
            &copy; {new Date().getFullYear()} Huska · Alle rettigheder forbeholdes
          </p>
          <p className="text-[12px] text-white/20">
            Lavet med omhu i Danmark 🇩🇰
          </p>
        </div>
      </div>
    </footer>
  );
}
