import { Mail, MessageSquare, Package, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Nav from '../components/Nav';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ONHAND;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONTACT_EMAIL = 'papspective@gmail.com';

const topics = ['Order Issue', 'Pre-order Question', 'Damaged Card / Missing Item', 'General Inquiry', 'Wholesale / Bulk'];

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact | CloudNineCards'; }, []);

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [message, setMessage] = useState('');

  function resetForm() {
    setSent(false);
    setName('');
    setEmail('');
    setTopic('');
    setOrderNum('');
    setMessage('');
    setSendError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        buyer_name:    name,
        buyer_email:   email,
        item_title:    `Contact Form — ${topic || 'General Inquiry'}`,
        item_subtitle: orderNum ? `Order #${orderNum}` : 'No order number provided',
        quantity:      1,
        full_price:    'N/A',
        dp_amount:     message,
        balance_due:   'N/A',
        eta:           'N/A',
        wise_handle:   CONTACT_EMAIL,
        to_email:      CONTACT_EMAIL,
      }, { publicKey: EMAILJS_PUBLIC_KEY });
      setSent(true);
    } catch {
      setSendError('Failed to send. Please email us directly at ' + CONTACT_EMAIL);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05010c] text-white">
      <section className="relative overflow-hidden border-b border-cyan-400/15 bg-[#07030f] px-6 pb-12 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Nav />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
              <Mail className="h-4 w-4" /> We actually reply
            </div>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-7xl">
              Contact
              <span className="block bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                Us
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/65">
              Question about your order? Pre-order ETA? Missing card? We're quick — usually within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
          {/* Info side */}
          <div className="flex flex-col gap-5">
            {[
              { icon: MessageSquare, title: 'General Support', desc: 'For product questions, shipping info, and anything else — use the form.', accent: 'cyan' },
              { icon: Package, title: 'Order Issues', desc: 'Include your order number in the message so we can pull it up fast.', accent: 'fuchsia' },
              { icon: ShieldCheck, title: 'Collector Promise', desc: "Every product is inspected before shipment. We make it right if something's wrong.", accent: 'yellow' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`rounded-[24px] border bg-white/4 p-5 ${
                  item.accent === 'cyan' ? 'border-cyan-300/15' :
                  item.accent === 'fuchsia' ? 'border-fuchsia-400/15' :
                  'border-yellow-300/15'
                }`}>
                  <div className={`mb-3 inline-flex rounded-xl border bg-black/25 p-2.5 ${
                    item.accent === 'cyan' ? 'border-cyan-300/20' :
                    item.accent === 'fuchsia' ? 'border-fuchsia-400/20' :
                    'border-yellow-300/20'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      item.accent === 'cyan' ? 'text-cyan-300' :
                      item.accent === 'fuchsia' ? 'text-fuchsia-400' :
                      'text-yellow-300'
                    }`} />
                  </div>
                  <div className="text-base font-black uppercase">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-white/60">{item.desc}</p>
                </div>
              );
            })}

            <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Response time</div>
              <div className="mt-1 text-2xl font-black">Usually within 24h</div>
              <div className="mt-1 text-sm text-white/55">Mon – Fri, 9 AM – 6 PM PST</div>
            </div>
          </div>

          {/* Form side */}
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1022,#14081d)] p-7">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center"
              >
                <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
                  <Mail className="h-10 w-10 text-cyan-300" />
                </div>
                <div className="text-2xl font-black uppercase">Message Sent!</div>
                <p className="max-w-xs text-sm text-white/60">We'll get back to you within 24 hours. Check your inbox.</p>
                <button
                  onClick={resetForm}
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 hover:bg-white/10"
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 rounded-t-[32px]" style={{ position: 'relative', height: 3, borderRadius: 2, background: 'linear-gradient(to right, #67e8f9, #e879f9, #fde047)', marginBottom: 8 }} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Name</label>
                    <input
                      required
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40 focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Email</label>
                    <input
                      required
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Topic</label>
                  <select
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75 outline-none focus:border-cyan-300/40"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  >
                    <option value="" disabled>Select a topic...</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Order # (optional)</label>
                  <input
                    type="text"
                    placeholder="#1234"
                    value={orderNum}
                    onChange={e => setOrderNum(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/50">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us what's up..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40 resize-none"
                  />
                </div>

                {sendError && (
                  <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                    {sendError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-400 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_10px_30px_rgba(34,211,238,0.25)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
