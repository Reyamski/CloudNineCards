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

  // shared
  const [email, setEmail] = useState('');

  // magic link
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  // password tab
  const [tab, setTab] = useState('magic'); // 'magic' | 'password'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('idle'); // idle | sending | success | error | reset
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => { document.title = 'My Account | CloudNineCards'; }, []);

  useEffect(() => {
    if (user) navigate('/account/orders', { replace: true });
  }, [user, navigate]);

  // ── Magic link handler ──────────────────────────────────────────────────────
  async function handleMagicLink(e) {
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

  // ── Password handler ────────────────────────────────────────────────────────
  async function handlePassword(e) {
    e.preventDefault();
    if (!supabase) return;
    setPasswordError('');

    if (isSignUp && password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordStatus('sending');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setPasswordError(error.message);
        setPasswordStatus('error');
      } else {
        setPasswordStatus('success');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setPasswordError(error.message || 'Invalid email or password.');
        setPasswordStatus('error');
      } else {
        navigate('/account/orders');
      }
    }
  }

  // ── Forgot password ─────────────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!supabase || !email.trim()) return;
    setPasswordError('');
    setPasswordStatus('sending');
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/account/reset` }
    );
    if (error) {
      setPasswordError(error.message);
      setPasswordStatus('error');
    } else {
      setPasswordStatus('reset');
    }
  }

  if (loading) return null;

  // ── Sign-up success screen ───────────────────────────────────────────────────
  const showSignUpConfirm = tab === 'password' && passwordStatus === 'success' && isSignUp;

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
              Sign in with a magic link or your email and password. Use the same email you ordered with to see your order history.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 py-16">

        {/* ── Magic link sent screen ── */}
        {status === 'sent' && tab === 'magic' ? (
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

        ) : showSignUpConfirm ? (
          /* ── Sign-up email confirm screen ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-[32px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-10 text-center"
          >
            <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 p-5">
              <Mail className="h-10 w-10 text-fuchsia-300" />
            </div>
            <div className="text-2xl font-black uppercase">Confirm Your Email</div>
            <p className="max-w-xs text-sm text-white/60">
              We sent a confirmation link to <span className="text-fuchsia-300">{email}</span>. Click it to activate your account.
            </p>
            <p className="text-xs text-white/35">Check your spam folder if it doesn't arrive within a minute.</p>
            <button
              onClick={() => { setPasswordStatus('idle'); setIsSignUp(false); setEmail(''); setPassword(''); setConfirmPassword(''); }}
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10"
            >
              Back to Sign In
            </button>
          </motion.div>

        ) : (
          /* ── Main form card ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-5 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-8"
          >
            {/* Tab toggle */}
            <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setTab('magic')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.14em] transition ${tab === 'magic' ? 'bg-cyan-300/20 text-cyan-200' : 'text-white/45 hover:text-white/65'}`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => setTab('password')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.14em] transition ${tab === 'password' ? 'bg-fuchsia-400/20 text-fuchsia-200' : 'text-white/45 hover:text-white/65'}`}
              >
                Sign In
              </button>
            </div>

            {/* ── Magic Link tab ── */}
            {tab === 'magic' && (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
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
              </form>
            )}

            {/* ── Password tab ── */}
            {tab === 'password' && (
              <form onSubmit={handlePassword} className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Email address</label>
                  <input
                    required
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setPasswordStatus('idle'); setPasswordError(''); }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPasswordStatus('idle'); setPasswordError(''); }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400/40"
                  />
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="mt-1.5 text-xs text-fuchsia-300/70 hover:text-fuchsia-300 transition"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Confirm Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setPasswordStatus('idle'); setPasswordError(''); }}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400/40"
                    />
                  </div>
                )}

                {passwordStatus === 'error' && (
                  <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                    {passwordError || 'Something went wrong. Try again.'}
                  </div>
                )}

                {passwordStatus === 'reset' && (
                  <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-4 py-3 text-xs text-fuchsia-200">
                    Password reset email sent! Check your inbox.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordStatus === 'sending'}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_10px_30px_rgba(168,85,247,0.25)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {passwordStatus === 'sending'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {isSignUp ? 'Creating...' : 'Signing in...'}</>
                    : isSignUp ? 'Create Account' : 'Sign In'
                  }
                </button>

                <div className="text-center text-xs text-white/40">
                  {isSignUp ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setIsSignUp(false); setPasswordStatus('idle'); setPasswordError(''); setConfirmPassword(''); }}
                        className="text-fuchsia-300 hover:text-fuchsia-200 transition"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setIsSignUp(true); setPasswordStatus('idle'); setPasswordError(''); }}
                        className="text-fuchsia-300 hover:text-fuchsia-200 transition"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        )}
      </section>
      <Footer />
    </div>
  );
}
