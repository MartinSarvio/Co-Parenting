import { useState, useEffect } from 'react';
import { Star, Quote, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  name: string;
  role: string;
  stars: number;
  quote: string;
  created_at: string;
}

export default function AnmeldelserPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .gte('stars', 3)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { setError('Vælg antal stjerner'); return; }
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('reviews').insert({
      name, role, stars, quote,
    });

    if (insertError) {
      setError('Noget gik galt. Prøv igen.');
    } else {
      setSuccess(true);
      setName(''); setRole(''); setStars(0); setQuote('');
      fetchReviews();
      setTimeout(() => setSuccess(false), 4000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em]">
            Anmeldelser
          </h1>
          <p className="mt-4 text-[1.05rem] text-[#4a4a4a] max-w-xl mx-auto leading-relaxed">
            Læs hvad andre familier siger om Huska — eller del din egen oplevelse.
          </p>
        </div>
      </section>

      {/* Write review */}
      <section className="pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl border border-[#e5e3dc] bg-[#fafaf8]">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">Skriv en anmeldelse</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Navn</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dit navn"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Rolle</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Fx 'Far til 2' eller 'Co-parenting mor'"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                  />
                </div>
              </div>

              {/* Stars */}
              <div>
                <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Bedømmelse</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          s <= (hoverStars || stars)
                            ? 'fill-[#1a1a1a] text-[#1a1a1a]'
                            : 'text-[#d4d3cd]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div>
                <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Din anmeldelse</label>
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Fortæl om din oplevelse med Huska..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  Tak for din anmeldelse!
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#2f2f2f] disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={16} />
                    Send anmeldelse
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* All reviews */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8 text-center">
            Hvad familierne siger
          </h2>

          {reviews.length === 0 ? (
            <p className="text-center text-[#78766d]">Ingen anmeldelser endnu. Bliv den første!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-6 rounded-2xl bg-white border border-[#e5e3dc] shadow-sm"
                >
                  <Quote size={20} className="text-[#1a1a1a]/15 mb-3" />

                  <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-4">
                    &ldquo;{r.quote}&rdquo;
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-[13px] font-bold">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">{r.name}</p>
                      <p className="text-[11px] text-[#78766d]">{r.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: r.stars }).map((_, j) => (
                        <Star key={j} size={12} className="fill-[#1a1a1a] text-[#1a1a1a]" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
