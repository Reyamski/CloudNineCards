import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Minimal toast system — single in-flight toast at a time, auto-dismiss after
// ~2.4s. Reused by Add to Cart confirmations across product pages.

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, options = {}) => {
    setToast({ message, ...options, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.duration ?? 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#07030f]/95 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_40px_rgba(34,211,238,0.18)] backdrop-blur"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10">
                <Check className="h-3.5 w-3.5 text-cyan-300" />
              </span>
              <span>{toast.message}</span>
              {toast.actionTo && (
                <Link
                  to={toast.actionTo}
                  className="ml-2 inline-flex items-center gap-1 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-300/20"
                >
                  {toast.actionLabel ?? 'View'}
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Silent no-op if rendered outside a ToastProvider, so demo pages/tests
    // don't blow up.
    return { showToast: () => {} };
  }
  return ctx;
}
