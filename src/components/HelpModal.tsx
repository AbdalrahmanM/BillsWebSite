import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
  subject?: string;
  body?: string;
  showWhatsApp?: boolean; // show WhatsApp button when true
  whatsappNumber?: string; // E.g., +9647XXXXXXXXX or 9647XXXXXXXXX
  whatsappMessage?: string; // Prefilled message
  /**
   * Optionally force dark mode from parent. If not provided, the component
   * will auto-detect using documentElement class `bh-dark` and localStorage('darkMode').
   */
  darkMode?: boolean;
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose, email = 'support@example.com', subject, body, showWhatsApp = false, whatsappNumber, whatsappMessage, darkMode: darkModeProp }) => {
  const { t } = useTranslation();
  // Auto-detect dark mode using html.bh-dark or localStorage, but allow overriding via prop
  const initialDark = useMemo(() => {
    if (typeof darkModeProp === 'boolean') return darkModeProp;
    try {
      if (typeof document !== 'undefined') {
        const htmlHas = document.documentElement.classList.contains('bh-dark');
        if (htmlHas) return true;
      }
      return localStorage.getItem('darkMode') === 'true';
    } catch {
      return false;
    }
  }, [darkModeProp]);

  const [darkMode, setDarkMode] = useState<boolean>(initialDark);

  useEffect(() => {
    if (typeof darkModeProp === 'boolean') {
      setDarkMode(darkModeProp);
      return;
    }
    // Observe html class changes to react to theme toggles instantly
    let observer: MutationObserver | undefined;
    try {
      const el = document.documentElement;
      observer = new MutationObserver(() => {
        setDarkMode(el.classList.contains('bh-dark'));
      });
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    } catch {}
    // Also reflect storage changes (e.g., from other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'darkMode') setDarkMode(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => {
      try { observer && observer.disconnect(); } catch {}
      window.removeEventListener('storage', onStorage);
    };
  }, [darkModeProp]);

  if (!open) return null;

  // Localized defaults for subject/body/messages when not provided via props
  const effectiveSubject = subject ?? t('help.email.subject');
  const effectiveBody = body ?? t('help.email.body');
  const effectiveWhatsappMsg = whatsappMessage ?? t('help.whatsappMessage');

  const mailto = `mailto:${email}?subject=${encodeURIComponent(effectiveSubject)}&body=${encodeURIComponent(effectiveBody)}`;
  const waDigits = (whatsappNumber || '').replace(/[^0-9]/g, '');
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(effectiveWhatsappMsg)}` : undefined;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}>
      <div className={`relative w-full max-w-md rounded-3xl p-8 shadow-xl ${darkMode ? 'bg-gray-900 text-blue-200' : 'bg-white'}`}>
        <button
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <span className="material-icons">close</span>
        </button>

        <div className="flex items-center justify-center mb-4">
          <span className={`material-icons text-5xl ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>headset_mic</span>
        </div>
  <div className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>{t('help.title')}</div>
  <div className={`text-center mb-6 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>{t('help.subtitle')}</div>

        <div className="flex flex-col gap-3">
          <a
            href={mailto}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-semibold shadow ${darkMode ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            onClick={onClose}
          >
            <span className="material-icons">mail</span>
            {t('help.actions.email')}
          </a>
          {showWhatsApp && waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-semibold shadow ${darkMode ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
              onClick={onClose}
            >
              <span className="material-icons">chat</span>
              {t('help.actions.whatsapp')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
