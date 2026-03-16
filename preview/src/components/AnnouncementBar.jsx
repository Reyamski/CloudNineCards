import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';

const PO_OPEN_DATE  = new Date('2025-11-01T00:00:00');
const PO_CLOSE_DATE = new Date('2026-04-30T23:59:59');

export default function AnnouncementBar() {
  const now = new Date();
  const isOpen = now >= PO_OPEN_DATE && now <= PO_CLOSE_DATE;

  return (
    <div className="relative z-50 overflow-hidden bg-gradient-to-r from-fuchsia-600 via-rose-500 to-fuchsia-600 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
      {/* shimmer */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-[shimmer_2.5s_infinite]" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2.5s infinite linear' }} />
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      <Link to="/pre-orders" className="inline-flex items-center gap-2 hover:opacity-85 transition">
        <BellRing className="h-3.5 w-3.5 animate-pulse" />
        {isOpen
          ? <>Pre-orders now open — 30% DP via Wise · International shipping &amp; taxes covered by buyer<span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Reserve Now →</span></>
          : <>Pre-orders are currently closed · Follow us for the next drop announcement<span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Learn More →</span></>
        }
      </Link>
    </div>
  );
}
