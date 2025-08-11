import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpModal from '../components/HelpModal';

import imgMarket from '../assets/shooping.jpg';
import imgPark from '../assets/park.png';
import imgBmw from '../assets/bmw.jpg';
import imgApple from '../assets/apple vision.jpg';

type Ad = {
  id: string;
  title: string;
  image: string;
  description: string;
  url?: string;
};

const ADS: Ad[] = [
  {
    id: 'market',
    title: 'Supermarket Offers',
    image: imgMarket,
    description: "Big discounts this week on groceries and household items. Don't miss out on our limited-time deals!",
    url: 'https://example.com/ads/market',
  },
  {
    id: 'park',
    title: 'Community Park Event',
    image: imgPark,
    description: 'Join our family-friendly event at the community park this Friday. Games, food, and fun for everyone!',
    url: 'https://example.com/ads/park',
  },
  {
    id: 'bmw',
    title: 'BMW New Models',
    image: imgBmw,
    description: 'Explore the latest BMW models with exceptional performance and design. Test-drive today.',
    url: 'https://example.com/ads/bmw',
  },
  {
    id: 'apple-vision',
    title: 'Teach&New',
    image: imgApple,
    description: 'Experience the next wave of spatial computing with stunning visuals and immersive apps.',
    url: 'https://www.apple.com/',
  },
];

export default function AdsPage() {
  // Auto-detect dark mode to match the app
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
    const onStorage = (e: StorageEvent) => { if (e.key === 'darkMode') setDarkMode(e.newValue === 'true'); };
    window.addEventListener('storage', onStorage);
    return () => { try { obs && obs.disconnect(); } catch {}; window.removeEventListener('storage', onStorage); };
  }, []);

  const [selected, setSelected] = useState<Ad | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      {/* Header styled like Bills page */}
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-800' : ''}`} style={{ background: darkMode ? undefined : '#dbeafe' }}>
                  <span className={`material-icons ${darkMode ? 'text-blue-300' : ''}`} style={{ color: darkMode ? undefined : '#3b82f6' }}>
                    campaign
                  </span>
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>Ads</div>
                  <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>
                    Browse latest community ads
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  aria-label="Home"
                  className={`rounded-xl p-2 shadow ${darkMode ? 'bg-gray-800 text-blue-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-100'}`}
                >
                  <span className="material-icons">home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

  <main className="mx-auto w-full max-w-4xl p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {ADS.map((ad) => (
            <button
              key={ad.id}
              onClick={() => setSelected(ad)}
              className={`group relative overflow-hidden rounded-2xl text-left shadow transition hover:scale-[1.01] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <img src={ad.image} alt={ad.title} className="w-full h-40 object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-lg drop-shadow">{ad.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer: Support & Logout */}
      <footer className={`mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: '#f7f6f2' }}>
        <button onClick={() => setHelpOpen(true)} className={`flex items-center gap-2 ${darkMode ? 'text-blue-400 hover:text-white' : 'text-[#7c7c7c] hover:text-blue-700'}`}>
          <span className="material-icons">support_agent</span>
          Support
        </button>
        <button className={`flex items-center gap-2 ${darkMode ? 'text-red-400 hover:text-red-200 font-bold' : 'text-[#e74c3c] hover:text-red-800 font-bold'}`} onClick={() => {
          try {
            sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: 'Logged out successfully' }));
          } catch {}
          localStorage.removeItem('userPhone');
          try { sessionStorage.removeItem('userPhone'); } catch {}
          navigate('/');
        }}>
          <span className="material-icons">logout</span>
          Logout
        </button>
      </footer>

      {selected && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}>
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <button
              className={`absolute top-3 right-3 z-10 rounded-full p-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow`}
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <span className="material-icons">close</span>
            </button>
            <img src={selected.image} alt={selected.title} className="w-full h-64 object-cover" />
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>{selected.title}</h2>
              <p className={`${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{selected.description}</p>
              <div className="mt-6 flex gap-3">
                <button
                  className={`px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 ${darkMode ? 'bg-gray-700 text-blue-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setSelected(null)}
                >
                  <span className="material-icons">arrow_back</span>
                  Back
                </button>
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 ${darkMode ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    onClick={() => setSelected(null)}
                  >
                    <span className="material-icons">open_in_new</span>
                    Go to Ad
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help modal */}
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
