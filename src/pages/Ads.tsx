import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpModal from '../components/HelpModal';
import { MotionSwap } from "../components/MotionToast";
import useIdleLogout from '../hooks/useIdleLogout';
import { useLanguage } from "../LanguageProvider";
import { useTranslation } from 'react-i18next';

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

const ADS_BASE: Array<{ id: Ad['id']; image: string; url?: string }> = [
  { id: 'market', image: imgMarket, url: 'https://example.com/ads/market' },
  { id: 'park', image: imgPark, url: 'https://example.com/ads/park' },
  { id: 'bmw', image: imgBmw, url: 'https://example.com/ads/bmw' },
  { id: 'apple-vision', image: imgApple, url: 'https://www.apple.com/' },
];

export default function AdsPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { t } = useTranslation();
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const ADS: Ad[] = useMemo(() => (
    ADS_BASE.map(({ id, image, url }) => ({
      id,
      image,
      url,
      title: t(`ads.items.${id}.title`),
      description: t(`ads.items.${id}.description`),
    }))
  // re-compute on language change
  ), [t]);
  const selected = useMemo(() => (selectedId ? ADS.find(a => a.id === selectedId) || null : null), [selectedId, ADS]);

  // Auto logout on inactivity (same behavior as Home)
  useIdleLogout({ timeoutMs: 3 * 60 * 1000, enabled: true, message: t('home.idleLogoutMessage') });

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
                  <div className={`text-2xl font-extrabold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{t('ads.title')}</div>
                  <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>{t('ads.subtitle')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Animated expandable Home button */}
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  aria-label={t('common.home')}
                  className={`HomeBtnExpand ${isAr ? 'rtl' : ''}`}
                >
                  <span className="icon material-icons" aria-hidden="true">home</span>
                  <span className="label">{t('common.home')}</span>
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
        onClick={() => setSelectedId(ad.id)}
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
        {/* Chat style support button */}
          {/* Expandable support button (SupBtnExpand) */}
          <button
            type="button"
            aria-label={t('common.support')}
            onClick={() => setHelpOpen(true)}
            className={`SupBtnExpand ${isAr ? 'rtl' : ''}`}
          >
            <span className="icon material-icons" aria-hidden="true">support_agent</span>
            <span className="label"><MotionSwap switchKey={lang}>{t('common.support')}</MotionSwap></span>
          </button>
        {/* Custom animated logout button */}
        <button
          type="button"
          aria-label={t('home.logout.text')}
          className={`LogoutBtn ${isAr ? 'rtl' : ''}`}
          onClick={() => {
            try {
              sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: t('home.logout.success') }));
            } catch {}
            localStorage.removeItem('userPhone');
            try { sessionStorage.removeItem('userPhone'); } catch {}
            navigate('/');
          }}
        >
          <div className="sign">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
            </svg>
          </div>
          <div className="text">{t('home.logout.text')}</div>
        </button>
      </footer>

      {selected && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}>
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <button
              className={`absolute top-3 right-3 z-10 rounded-full p-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow`}
              onClick={() => setSelectedId(null)}
              aria-label={t('common.close')}
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
                  onClick={() => setSelectedId(null)}
                >
                  <span className="material-icons">arrow_back</span>
                  {t('common.back')}
                </button>
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 ${darkMode ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    onClick={() => setSelectedId(null)}
                  >
                    <span className="material-icons">open_in_new</span>
                    {t('ads.actions.goToAd')}
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
  whatsappMessage={t('ads.whatsappMessage', { phone: (localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '') })}
      />
    </div>
  );
}
