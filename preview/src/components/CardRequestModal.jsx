import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// Guest "Source an Item / Card Request" modal (F3). No login required.
// Visually mirrors ShopPage's NotifyMeModal so it stays consistent. On submit
// it POSTs to /api/card-request (service-role insert into card_requests).
export default function CardRequestModal({ onClose, onSuccess }) {
  const [email, setEmail]       = useState('');
  const [cardName, setCardName] = useState('');
  const [setDetails, setSetDetails] = useState('');
  const [notes, setNotes]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/card-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          card_name: cardName.trim(),
          set_or_details: setDetails.trim(),
          notes: notes.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.error) {
        throw new Error(json?.error?.message || 'Submission failed.');
      }
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      console.error('Card request insert failed:', err);
      setSendError(err?.message || 'Something went wrong — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#07030f] overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
        <div className="p-6">
          <button onClick={onClose} className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 hover:bg-white/10">
            <X className="h-4 w-4 text-white/60" />
          </button>

          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 p-5">
                <Check className="h-10 w-10 text-fuchsia-300" />
              </div>
              <div className="text-2xl font-black uppercase">Request received</div>
              <p className="max-w-xs text-sm text-white/60 leading-6">
                We'll hunt for <span className="text-white/80">{cardName}</span> and email{' '}
                <span className="text-fuchsia-300">{email}</span> if we can source it. No payment until you confirm.
              </p>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-black uppercase text-white/65 hover:bg-white/10">
                Close
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300/70 mb-1">Source an Item</div>
                <div className="text-xl font-black leading-snug">Can't find a card? Request it</div>
                <p className="mt-1.5 text-xs text-white/45 leading-5">
                  Tell us what you're after and we'll track it down. No account needed — just an email so we can reach you.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="Card name (e.g. Monkey D. Luffy OP01-024)"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
                />
                <input
                  type="text"
                  value={setDetails}
                  onChange={e => setSetDetails(e.target.value)}
                  placeholder="Set / language / condition (optional)"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anything else? Budget, quantity, deadline… (optional)"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none resize-none"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
                />
                {sendError && <p className="text-xs text-red-400">{sendError}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Submit Request'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
