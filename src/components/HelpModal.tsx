import React, { useMemo } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
  subject?: string;
  body?: string;
  showWhatsApp?: boolean; // show WhatsApp button when true
  whatsappNumber?: string; // E.g., +9647XXXXXXXXX or 9647XXXXXXXXX
  whatsappMessage?: string; // Prefilled message
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose, email = 'support@example.com', subject = 'Billing Hub Support Request', body = 'Hello Support,\n\nI need help with ...', showWhatsApp = false, whatsappNumber, whatsappMessage = 'Hello, I need help with my bills.' }) => {
  const darkMode = useMemo(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  }, []);

  if (!open) return null;

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const waDigits = (whatsappNumber || '').replace(/[^0-9]/g, '');
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(whatsappMessage)}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`relative w-full max-w-md rounded-3xl p-8 shadow-xl ${darkMode ? 'bg-gray-900 text-blue-200' : 'bg-white'}`}>
        <button
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
          onClick={onClose}
          aria-label="Close"
        >
          <span className="material-icons">close</span>
        </button>

        <div className="flex items-center justify-center mb-4">
          <span className={`material-icons text-5xl ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>headset_mic</span>
        </div>
        <div className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>We're Here for You</div>
        <div className={`text-center mb-6 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>Our support team is here to assist you at any time.</div>

        <div className="flex flex-col gap-3">
          <a
            href={mailto}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-semibold shadow ${darkMode ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            onClick={onClose}
          >
            <span className="material-icons">mail</span>
            Contact via Email
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
              Contact via WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
