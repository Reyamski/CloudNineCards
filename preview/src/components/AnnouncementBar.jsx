import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase';

const PO_OPEN_DATE  = new Date('2025-11-01T00:00:00');
const PO_CLOSE_DATE = new Date('2026-04-30T23:59:59'); // fallback if DB not loaded

export default function AnnouncementBar() {
  const [closeDate, setCloseDate] = useState(PO_CLOSE_DATE);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    supabase.from('config').select('value').eq('key', 'po_close_date').single()
      .then(({ data }) => {
        if (data?.value) setCloseDate(new Date(data.value));
      });
  }, []);

  const now    = new Date();
  const isOpen = now >= PO_OPEN_DATE && now <= closeDate;

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
            Pre-orders now open - 30% DP via Wise - international shipping and taxes covered by buyer
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
