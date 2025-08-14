import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpModal from '../components/HelpModal';
import useIdleLogout from '../hooks/useIdleLogout';

export default function AnnouncementPage() {
  // Auto logout on inactivity (align with Home)
  useIdleLogout({ timeoutMs: 3 * 60 * 1000, enabled: true, message: 'You were logged out due to inactivity' });
  const initialDark = useMemo(() => {
    try {
      if (document.documentElement.classList.contains('bh-dark')) return true;
      return localStorage.getItem('darkMode') === 'true';
    } catch { return false; }
  }, []);
  const [darkMode, setDarkMode] = useState(initialDark);
  useEffect(() => {
    const el = document.documentElement;
    let obs: MutationObserver | undefined;
    try {
      obs = new MutationObserver(() => setDarkMode(el.classList.contains('bh-dark')));
      obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    } catch {}
    return () => { try { obs && obs.disconnect(); } catch {} };
  }, []);

  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  type DetailKey = 'maintenance' | 'payment' | 'sales' | 'holiday';
  const [active, setActive] = useState<DetailKey | null>(null);

  const details: Record<DetailKey, { title: string; bg: string; points: string[] }> = {
    maintenance: {
      title: 'Maintenance Notice',
      bg: "url('/background/maintenance.png')",
      points: [
        'Our system will be under maintenance this weekend.',
        'Window: Saturday 02:00 AM – 04:00 AM (local time).',
        'Affected services: Payments, Bill History.',
        'We will post updates here once completed.'
      ],
    },
    payment: {
      title: 'New Payment Option',
      bg: "url('/background/payment.png')",
      points: [
        'You can now pay using Apple Pay / Google Pay.',
        'Secure and fast checkout on mobile and web.',
        'Make sure your app is updated to the latest version.'
      ],
    },
    sales: {
      title: 'Special Offer!',
      bg: "url('/background/sales.png')",
      points: [
        'Get 20% off your next bill payment.',
        'Valid through this month only.',
        'Promo code: SAVE20 (one-time use).',
        'Terms and conditions apply.'
      ],
    },
    holiday: {
      title: 'Holiday Alert',
      bg: "url('/background/holiday.png')",
      points: [
        'Office will be closed on July 4th.',
        'Support response times may be delayed.',
        'Online services remain available.'
      ],
    },
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      <header className={`px-8 pt-6 ${darkMode ? 'bg-gray-900/40' : ''}`}>
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="relative overflow-hidden rounded-3xl shadow"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
          >
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background: darkMode
                  ? 'linear-gradient(90deg, rgba(31,41,55,0.9) 0%, rgba(17,24,39,0.9) 100%)'
                  : 'linear-gradient(90deg, #dbeafe 0%, #ffffff 100%)',
              }}
            />
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className={`text-2xl font-extrabold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>
                    Announcement
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>
                    Attention Please
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/home')} aria-label="Home" className="HomeBtnExpand">
                  <span className="icon material-icons" aria-hidden="true">home</span>
                  <span className="label">Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl p-6">
        {/* Highlight card */}
        <div
          className={`${darkMode ? 'bg-gray-800/90 text-blue-100' : 'bg-white/90 text-gray-700'} rounded-2xl p-6 shadow overflow-hidden relative`}
          style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-rose-200/40 to-rose-400/20" />
          <div className="relative flex items-start gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight mb-1">Important Notice</h2>
              <p className={`${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>
                Attention Please: This is an important announcement for all users. Stay tuned for updates and
                make sure your contact information is up-to-date.
              </p>
            </div>
          </div>
        </div>

        {/* Cards grid similar to the mobile preview */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Maintenance Notice */}
          <button
            type="button"
            onClick={() => setActive('maintenance')}
            className={`group relative overflow-hidden rounded-2xl text-left shadow transition hover:scale-[1.01] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <img src={details.maintenance.bg.slice(5, -2)} alt="Maintenance" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="rounded-xl px-2 py-1 text-xs font-semibold bg-white/90 text-gray-700 shadow">Scheduled</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg drop-shadow">Maintenance Notice</h3>
              <p className="text-white/80 text-sm">Our system will be under maintenance this weekend</p>
            </div>
          </button>

          {/* New Payment Option */}
          <button
            type="button"
            onClick={() => setActive('payment')}
            className={`group relative overflow-hidden rounded-2xl text-left shadow transition hover:scale-[1.01] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <img src={details.payment.bg.slice(5, -2)} alt="New Payment Option" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="rounded-xl px-2 py-1 text-xs font-semibold bg-white/90 text-gray-700 shadow">New</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg drop-shadow">New Payment Option</h3>
              <p className="text-white/80 text-sm">You can now pay your bills using Apple Pay / Google Pay</p>
            </div>
          </button>

          {/* Special Offer */}
          <button
            type="button"
            onClick={() => setActive('sales')}
            className={`group relative overflow-hidden rounded-2xl text-left shadow transition hover:scale-[1.01] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <img src={details.sales.bg.slice(5, -2)} alt="Special Offer" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute top-3 right-3">
              <span className="rounded-xl px-2 py-1 text-xs font-semibold bg-white/90 text-gray-700 shadow">Promo</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg drop-shadow">Special Offer!</h3>
              <p className="text-white/80 text-sm">Get 20% off your next bill payment.</p>
            </div>
          </button>

          {/* Holiday Alert */}
          <button
            type="button"
            onClick={() => setActive('holiday')}
            className={`group relative overflow-hidden rounded-2xl text-left shadow transition hover:scale-[1.01] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <img src={details.holiday.bg.slice(5, -2)} alt="Holiday Alert" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg drop-shadow">Holiday Alert</h3>
              <p className="text-white/80 text-sm">Office will be closed on July 4th.</p>
            </div>
          </button>
        </div>
      </main>

      {/* Details Modal - styled like Ads modal (no external action button) */}
      {active && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`absolute top-3 right-3 z-10 rounded-full p-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow`}
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: details[active].bg }} />
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>{details[active].title}</h2>
              <p className={`${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>
                {details[active].points.join(' ')}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  className={`px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 ${darkMode ? 'bg-gray-700 text-blue-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setActive(null)}
                >
                  <span className="material-icons">arrow_back</span>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={`mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: '#f7f6f2' }}>
        <button type="button" aria-label="Support" onClick={() => setHelpOpen(true)} className="SupBtnExpand">
          <span className="icon material-icons" aria-hidden="true">support_agent</span>
          <span className="label">Support</span>
        </button>
        <button
          type="button"
          aria-label="Logout"
          className="LogoutBtn"
          onClick={() => { try { sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: 'Logged out successfully' })); } catch {}; localStorage.removeItem('userPhone'); try { sessionStorage.removeItem('userPhone'); } catch {}; navigate('/'); }}
        >
          <div className="sign">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
            </svg>
          </div>
          <div className="text">Logout</div>
        </button>
      </footer>

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        showWhatsApp
        whatsappNumber={(localStorage.getItem('supportWhatsApp') || '9647700000000')}
        whatsappMessage={`Hello, I need help. Phone: ${(localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '')}`}
      />
    </div>
  );
}
