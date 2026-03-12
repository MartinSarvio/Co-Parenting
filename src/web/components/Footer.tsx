import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-4">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#funktioner" className="text-white/50 hover:text-white transition-colors">Funktioner</a></li>
              <li><a href="#hvordan" className="text-white/50 hover:text-white transition-colors">Sådan virker det</a></li>
              <li><a href="#om" className="text-white/50 hover:text-white transition-colors">Om os</a></li>
              <li><a href="#admin" className="text-white/50 hover:text-white transition-colors">Admin</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-4">Kontakt</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="text-white/50">kontakt@huska.dk</li>
              <li><a href="#privatlivspolitik" className="text-white/50 hover:text-white transition-colors">Privatlivspolitik</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors">Vilkår og betingelser</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">
            &copy; {new Date().getFullYear()} Huska. Alle rettigheder forbeholdes.
          </p>
          <p className="text-[12px] text-white/30 flex items-center gap-1">
            Lavet med <Heart size={11} className="text-[#f58a2d]/60 fill-[#f58a2d]/60" /> i Danmark
          </p>
        </div>
      </div>
    </footer>
  );
}
