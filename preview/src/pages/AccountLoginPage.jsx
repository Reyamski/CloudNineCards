import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2 } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

export default function AccountLoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { document.title = 'My Account | CloudNineCards'; }, []);

  useEffect(() => {
    if (user) navigate('/account/orders', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    setStatus('sending');
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/account/orders` },
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-cyan-400/15 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
              <Mail className="h-4 w-4" /> Buyer Portal
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              My
              <span className="block bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                Account
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              Enter your email to receive a magic link — no password needed. Use the same email you ordered with to see your order history.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 py-16">
        {status === 'sent' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-[32px] border border-cyan-300/20 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-10 text-center"
          >
            <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
              <Mail className="h-10 w-10 text-cyan-300" />
            </div>
            <div className="text-2xl font-black uppercase">Check Your Inbox</div>
            <p className="max-w-xs text-sm text-white/60">
              We sent a login link to <span className="text-cyan-300">{email}</span>. Click it to view your orders — no password needed.
            </p>
            <p className="text-xs text-white/35">Check your spam folder if it doesn't arrive within a minute.</p>
            <button
              onClick={() => { setStatus('idle'); setEmail(''); }}
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10"
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-8"
          >
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Email address</label>
              <input
                required
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40"
              />
              <p className="mt-2 text-xs text-white/35">Use the same email you placed your order with.</p>
            </div>

            {status === 'error' && (
              <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                {errorMsg || 'Something went wrong. Try again.'}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_10px_30px_rgba(34,211,238,0.25)] transition hover:opacity-95 disabled:opacity-60"
            >
              {status === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Send Magic Link'}
            </button>
          </motion.form>
        )}
      </section>
      <Footer />
    </div>
  );
}
