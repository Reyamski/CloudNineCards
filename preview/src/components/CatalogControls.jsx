import { Search, SlidersHorizontal, Mail } from 'lucide-react';

// Shared catalog toolbar used by Singles and Shop so the two pages stay
// visually identical. Two parts:
//   1. RequestCardBanner — a clear, explained "can't find it? ask us" CTA.
//      It is a real conversion path, so it gets its own surface instead of
//      being hidden as a ghost pill in a button row.
//   2. ControlsBar — optional search + a prominent Filter & Sort button with
//      an active-filter count badge.
// All click handlers are passed in by the page; this component owns layout
// and styling only — no data, queries, or submit logic.

// ── "Request a card" CTA banner ───────────────────────────────────────────────
export function RequestCardBanner({ onRequest }) {
  return (
    <div className="rounded-[20px] border border-cyan-300/25 bg-[linear-gradient(110deg,rgba(34,211,238,0.10),rgba(168,85,247,0.08))] px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-2 shrink-0">
          <Mail className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <div className="text-sm font-black uppercase tracking-[0.12em] text-white">
            Looking for a card we don't have?
          </div>
          <p className="mt-1 text-xs text-white/55 leading-5 max-w-md">
            Tell us what you need and we'll try to source it. No account, no payment until you confirm.
          </p>
        </div>
      </div>
      <button
        onClick={onRequest}
        className="shrink-0 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:opacity-90"
      >
        Request a Card
      </button>
    </div>
  );
}

// ── Search + Filter & Sort bar ────────────────────────────────────────────────
export function ControlsBar({
  search,                 // string | undefined — omit to hide the search field
  onSearchChange,         // (value) => void
  searchPlaceholder = 'Search…',
  activeFilterCount = 0,
  onOpenFilters,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {typeof search === 'string' && (
        <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40"
          />
        </div>
      )}
      <button
        onClick={onOpenFilters}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-xs font-black uppercase tracking-[0.14em] transition sm:w-auto ${
          activeFilterCount > 0
            ? 'border-fuchsia-400/55 bg-fuchsia-400/15 text-fuchsia-100'
            : 'border-cyan-300/30 bg-white/5 text-white/80 hover:border-cyan-300/45 hover:bg-white/10'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" /> Filter &amp; Sort
        {activeFilterCount > 0 && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-400 px-1 text-[10px] font-black text-black">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
