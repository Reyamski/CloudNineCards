import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase';

// Banner state is derived from the live `preorders` table — not a stale
// config date. If at least one row has `sold_out=false`, we treat pre-orders
// as actively open and link to /pre-orders. Otherwise we show the "closed,
// follow us for the next drop" state and link to /contact. Any fetch error
// falls through to the closed state so the banner can never falsely claim
// pre-orders are open.
export default function AnnouncementBar() {
  const [hasActivePreorder, setHasActivePreorder] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    let cancelled = false;
    supabase
      .from('preorders')
      .select('id', { count: 'exact', head: true })
      .eq('sold_out', false)
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) {
          setHasActivePreorder(false);
          return;
        }
        setHasActivePreorder((count ?? 0) > 0);
      });
    return () => { cancelled = true; };
  }, []);

  const isOpen = hasActivePreorder;

  return (
    <div className="relative z-50 overflow-hidden bg-gradient-to-r from-fuchsia-600 via-rose-500 to-fuchsia-600 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)]"
        style={{backgroundSize: '200% 100%', animation: 'shimmer 2.5s infinite linear'}}
      />
      <style>{'@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }'}</style>
      <Link to={isOpen ? '/pre-orders' : '/contact'} className="relative inline-flex items-center gap-2 transition hover:opacity-85">
        <BellRing className="h-3.5 w-3.5 animate-pulse" />
        {isOpen ? (
          <>
            Pre-orders open - reserve your slot - 30% DP via Wise
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Reserve Now -&gt;</span>
          </>
        ) : (
          <>
            Pre-orders are currently closed - follow us for the next drop announcement
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Learn More -&gt;</span>
          </>
        )}
      </Link>
    </div>
  );
}
