import React, { useState, useEffect, useRef, useCallback } from "react";
import useIdleLogout from "../hooks/useIdleLogout";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import HelpModal from '../components/HelpModal';
import { MotionSwap } from "../components/MotionToast";
import { useLanguage } from "../LanguageProvider";

interface Bill {
  amount: number;
  billId: string;
  dueDate: any;
  month: string;
  status: string;
  type: string;
  year: string;
}

const Home = () => {
  const { lang } = useLanguage();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const [userName, setUserName] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoadRef = useRef(true);
  const [helpOpen, setHelpOpen] = useState(false);
  // Rotate banner between Ads and Announcement every 5s
  const [bannerMode, setBannerMode] = useState<'ads' | 'announcement'>('ads');
  // swipe & auto-rotate helpers
  const swipeStartXRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);
  const rotateIntervalRef = useRef<number | null>(null);

  const startAutoRotate = useCallback(() => {
    if (rotateIntervalRef.current) {
      window.clearInterval(rotateIntervalRef.current);
    }
    rotateIntervalRef.current = window.setInterval(() => {
      setBannerMode((m) => (m === 'ads' ? 'announcement' : 'ads'));
    }, 5000);
  }, []);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    swipeStartXRef.current = e.clientX;
    isSwipingRef.current = false;
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (swipeStartXRef.current !== null) {
      const delta = e.clientX - swipeStartXRef.current;
      if (Math.abs(delta) > 10) isSwipingRef.current = true;
    }
  };

  const handlePointerEnd: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const start = swipeStartXRef.current;
    if (start !== null) {
      const delta = e.clientX - start;
      if (Math.abs(delta) > 40) {
        // Only two slides -> any direction toggles
        setBannerMode((m) => (m === 'ads' ? 'announcement' : 'ads'));
        // restart timer after manual interaction
        startAutoRotate();
      }
    }
    swipeStartXRef.current = null;
    // Allow click again after the pointer ends
    setTimeout(() => (isSwipingRef.current = false), 0);
  };
  useIdleLogout({ timeoutMs: 3 * 60 * 1000, enabled: true, message: lang === 'ar' ? 'تم تسجيل خروجك بسبب عدم النشاط' : 'You were logged out due to inactivity' });

  useEffect(() => {
    // reflect the initial value immediately
    document.documentElement.classList.toggle('bh-dark', darkMode);
  }, []);

  useEffect(() => {
    // reflect dark mode to document and persist
    localStorage.setItem("darkMode", String(darkMode));
    document.documentElement.classList.toggle("bh-dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    // start auto-rotation and clean up on unmount
    startAutoRotate();
    return () => {
      if (rotateIntervalRef.current) {
        window.clearInterval(rotateIntervalRef.current);
      }
    };
  }, [startAutoRotate]);

  useEffect(() => {
  const phone = localStorage.getItem("userPhone") || sessionStorage.getItem("userPhone");
    if (!phone) {
      window.location.href = "/";
      return;
    }
    let unsubscribe = false;
    const fetchUser = async () => {
      if (firstLoadRef.current) setLoading(true);
      const q = query(collection(db, "Users"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        setUserName(data.name + " " + (data.lastname || ""));

        const billsRef = collection(db, "Users", userDoc.id, "Bills");
        const billsQuery = query(billsRef, orderBy("dueDate", "desc"));
        const billsSnap = await getDocs(billsQuery);
        const billsArr = billsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            amount: data.amount,
            billId: data.billId,
            dueDate: data.dueDate,
            month: data.month,
            status: data.status,
            type: data.type,
            year: data.year,
          } as Bill;
        });
        if (!unsubscribe) setBills(billsArr);
      }
      if (firstLoadRef.current) {
        setLoading(false);
        firstLoadRef.current = false;
      }
    };
    fetchUser();
    const interval = setInterval(() => {
      fetchUser();
    }, 10000);
    return () => {
      unsubscribe = true;
      clearInterval(interval);
    };
  }, []);

  function getLatestBillsByType(bills: Bill[]): Bill[] {
    const latest: { [type: string]: Bill } = {};
    bills.forEach(bill => {
      const billDate = bill.dueDate?.toDate?.() || new Date(bill.dueDate);
      const latestBill = latest[bill.type];
      if (!latestBill) {
        latest[bill.type] = bill;
      } else {
        const latestDate = latestBill.dueDate?.toDate?.() || new Date(latestBill.dueDate);
        if (billDate > latestDate) {
          latest[bill.type] = bill;
        }
      }
    });
    return Object.values(latest);
  }

  // i18n helpers for this page
  const typeLabel = (type: string) => {
    const mapEn: Record<string, string> = { water: 'Water', electricity: 'Electricity', gas: 'Gas', fees: 'Fees' };
    const mapAr: Record<string, string> = { water: 'الماء', electricity: 'الكهرباء', gas: 'الغاز', fees: 'الرسوم' };
    const key = String(type).toLowerCase();
    return (lang === 'ar' ? mapAr[key] : mapEn[key]) || type;
  };
  const statusLabel = (status: string) => {
    const s = String(status).toLowerCase();
    if (lang === 'ar') return s === 'paid' ? 'مدفوع' : s === 'unpaid' ? 'غير مدفوع' : status;
    return status;
  };
  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      <header className={`flex items-center justify-between px-8 py-4 ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: 'linear-gradient(90deg, #e3eaf6 0%, #f7f6f2 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className={`material-icons text-2xl ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>dashboard</span>
          <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>{isAr ? 'مركز الفواتير' : 'Billing Hub'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            title={darkMode ? (isAr ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode')}
            aria-pressed={darkMode}
            onClick={() => setDarkMode((prev) => !prev)}
            className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
          >
            <span className="relative inline-flex items-center justify-center">
              {/* soft glow */}
              <span aria-hidden className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-400/40 via-sky-400/40 to-purple-400/40 blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
              {/* gradient ring */}
              <span className="relative rounded-full p-[2px] bg-gradient-to-r from-indigo-400/70 via-sky-400/70 to-purple-400/70">
                {/* glass body */}
                <span className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-colors ${darkMode ? 'bg-gray-900/70' : 'bg-white/70'}`}>
                  <span className="relative inline-block w-5 h-5">
                    {/* Sun icon */}
                    <span className={`material-icons absolute inset-0 text-[18px] transition-all duration-300 ease-out ${darkMode ? 'opacity-100 scale-100 rotate-0 text-yellow-200' : 'opacity-0 scale-75 -rotate-90 text-yellow-300'}`}>light_mode</span>
                    {/* Moon icon */}
                    <span className={`material-icons absolute inset-0 text-[18px] transition-all duration-300 ease-out ${darkMode ? 'opacity-0 scale-75 rotate-90 text-slate-200' : 'opacity-100 scale-100 rotate-0 text-slate-700'}`}>dark_mode</span>
                  </span>
                </span>
              </span>
            </span>
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl mt-8 p-2">
  {loading ? (
          <div className="flex items-center justify-center py-16" role="status" aria-label={isAr ? 'جاري التحميل' : 'Loading'}>
            <div className="w-full max-w-md">
              <div className="bh-progress">
                <div className="bh-progress__bar" />
                <div className="bh-progress__bar--alt" />
              </div>
            </div>
          </div>
        ) : (
  <>
  <div className={`flex items-center gap-4 rounded-2xl shadow p-5 mb-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className={`rounded-full w-14 h-14 flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-[#f7f6f2]'}`}>
            <span className={`material-icons text-3xl ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>person</span>
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>{isAr ? `مرحباً، ${userName || 'مستخدم'}` : `Hello, ${userName || 'User'}`}</h2>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-[#b1b1b1]'}`}>{isAr ? 'مرحباً بعودتك!' : 'Welcome back!'}</p>
          </div>
        </div>

        <div
          className="relative"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <a
            href={bannerMode === 'ads' ? '/ads' : '/announcement'}
            className="block relative rounded-2xl overflow-hidden shadow mb-6 select-none"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            onClick={(e) => {
              if (isSwipingRef.current) e.preventDefault();
            }}
          >
            <img
              src={bannerMode === 'ads' ? '/background/1.png' : '/background/1.jpg'}
              alt={bannerMode === 'ads' ? (isAr ? 'إعلانات' : 'Ads') : (isAr ? 'إشعار' : 'Announcement')}
              className="w-full h-28 object-cover"
              draggable={false}
            />
            <div className={`absolute inset-0 flex items-center justify-between px-6 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`}>
              <div className="flex flex-col">
                <span className="text-white text-2xl font-extrabold">
                  {bannerMode === 'ads' ? (isAr ? 'إعلانات' : 'Ads') : (isAr ? 'إشعار' : 'Announcement')}
                </span>
                <span className="text-white/90 text-sm font-semibold tracking-wide">
                  {bannerMode === 'ads' ? (isAr ? 'اطّلع على أحدث عروضنا!' : 'Check out our latest offers!') : (isAr ? 'تنبيه هام' : 'Important Notice')}
                </span>
              </div>
              <span className="relative group inline-flex items-center justify-center select-none">
                {/* soft glow */}
                <span aria-hidden className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-400/40 via-sky-400/40 to-purple-400/40 blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
                {/* gradient ring */}
                <span className="relative rounded-full p-[2px] bg-gradient-to-r from-indigo-400/70 via-sky-400/70 to-purple-400/70">
                  {/* glass body */}
                  <span className={`rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-md shadow-md transition-transform duration-200 ease-out ${isAr ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} ${darkMode ? 'bg-gray-900/70' : 'bg-white/70'}`}>
                    <span className={`material-icons text-base ${darkMode ? 'text-yellow-200' : 'text-slate-700'}`}>{isAr ? 'chevron_left' : 'chevron_right'}</span>
                  </span>
                </span>
              </span>
            </div>
          </a>
          {/* Dots indicator & manual control */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              type="button"
        aria-label={isAr ? 'عرض الإعلانات' : 'Show Ads'}
              onClick={() => { setBannerMode('ads'); startAutoRotate(); }}
              className={`transition-all ${bannerMode === 'ads' ? 'w-4 h-2 rounded-full bg-white/90' : 'w-2 h-2 rounded-full bg-white/60'} shadow`}
            />
            <button
              type="button"
        aria-label={isAr ? 'عرض الإشعار' : 'Show Announcement'}
              onClick={() => { setBannerMode('announcement'); startAutoRotate(); }}
              className={`transition-all ${bannerMode === 'announcement' ? 'w-4 h-2 rounded-full bg-white/90' : 'w-2 h-2 rounded-full bg-white/60'} shadow`}
            />
          </div>
        </div>

  <div className="grid grid-cols-2 gap-4 mb-8">
          {getLatestBillsByType(bills).length === 0 ? (
            <div className="col-span-2 text-center text-gray-500">{isAr ? 'لا توجد فواتير.' : 'No bills found.'}</div>
          ) : (
            // ترتيب البطاقات حسب الأنواع المطلوبة
            ["water", "electricity", "gas", "fees"].map((type, idx) => {
              const bill = getLatestBillsByType(bills).find(b => b.type === type);
              if (!bill) return null;
              return (
                <a
                  key={idx}
                  href={`/bills/${type}`}
                  className={`rounded-xl shadow p-5 flex flex-col items-start cursor-pointer transition hover:scale-105 ${darkMode ? 'bg-gray-800' : bill.type === 'water' ? 'bg-blue-200' : bill.type === 'gas' ? 'bg-yellow-100' : bill.type === 'electricity' ? 'bg-indigo-100' : 'bg-gray-100'}`}
                  style={{ minHeight: '120px', textDecoration: 'none' }}
                >
                  <span className={`material-icons mb-2 ${darkMode ? 'text-blue-300' : bill.type === 'water' ? 'text-blue-500' : bill.type === 'gas' ? 'text-yellow-600' : bill.type === 'electricity' ? 'bolt' : 'credit_card'}`}>
                    {bill.type === 'water' ? 'water_drop' : bill.type === 'gas' ? 'local_fire_department' : bill.type === 'electricity' ? 'bolt' : 'credit_card'}
                  </span>
                  <span className={`text-lg font-bold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{typeLabel(bill.type)}</span>
                  <span className={`text-xl font-bold mt-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>${bill.amount}</span>
                  <span className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{statusLabel(bill.status)}</span>
                </a>
              );
            })
          )}
        </div>
  </>
  )}
      </section>

  <footer className={`mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner relative ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: '#f7f6f2' }}>
        <button
          type="button"
          aria-label={lang === 'ar' ? 'الدعم' : 'Support'}
          onClick={() => setHelpOpen(true)}
          className={`SupBtnExpand ${isAr ? 'rtl' : ''}`}
        >
          <span className="icon material-icons" aria-hidden="true">support_agent</span>
          <span className="label"><MotionSwap switchKey={lang}>{lang === 'ar' ? 'الدعم' : 'Support'}</MotionSwap></span>
        </button>
        {/* Custom animated logout button */}
        <button
          type="button"
          aria-label={isAr ? 'تسجيل الخروج' : 'Logout'}
          className={`LogoutBtn ${isAr ? 'rtl' : ''}`}
          onClick={() => {
            try {
              sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: isAr ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully' }));
            } catch {}
            localStorage.removeItem("userPhone");
            try { sessionStorage.removeItem("userPhone"); } catch {}
            window.location.href = "/";
          }}
        >
          <div className="sign">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
            </svg>
          </div>
          <div className="text">{isAr ? 'تسجيل الخروج' : 'Logout'}</div>
        </button>
      </footer>
      {/* Support modal: show WhatsApp on authenticated pages */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        showWhatsApp
        whatsappNumber={(localStorage.getItem('supportWhatsApp') || '9647700000000')}
        whatsappMessage={isAr ? `مرحباً، أحتاج مساعدة في حسابي. المستخدم: ${userName || 'مستخدم'} | الهاتف: ${(localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '')}` : `Hello, I need help with my account. User: ${userName || 'User'} | Phone: ${(localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '')}`}
      />
    </div>
  );
};

export default Home;