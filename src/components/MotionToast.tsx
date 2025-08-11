import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// Compatibility: Some TS/CRA setups flag AnimatePresence because its return type can be undefined.
// Cast to any to satisfy TS 4.9 + @types/react combo without affecting runtime.
const AP: any = AnimatePresence;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface MotionToastProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-600/90 text-white shadow-emerald-400/40',
  error: 'bg-rose-600/90 text-white shadow-rose-400/40',
  info: 'bg-sky-600/90 text-white shadow-sky-400/40',
  warning: 'bg-amber-600/90 text-white shadow-amber-400/40',
};

export const MotionToast: React.FC<MotionToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => onDismiss(t.id), 3500));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, onDismiss]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] pointer-events-none">
      <div className="mx-auto w-full max-w-md px-3">
        <AP initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: 40, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: 40, opacity: 0, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`relative mb-3 rounded-xl px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-lg ${typeStyles[t.type]} pointer-events-auto`}
            >
              <div className="flex items-start gap-3">
                <div className="grow text-sm font-medium">{t.message}</div>
                <button
                  onClick={() => onDismiss(t.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs/5 bg-white/10 hover:bg-white/20"
                >
                  Close
                </button>
              </div>
              <div className="absolute inset-0 -z-10 rounded-xl shadow-[0_0_60px_10px_rgba(59,130,246,0.35)]" aria-hidden />
            </motion.div>
          ))}
        </AP>
      </div>
    </div>
  );
};

export default MotionToast;
