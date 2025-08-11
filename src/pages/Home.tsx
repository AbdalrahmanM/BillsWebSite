import React, { useState, useEffect, useRef } from "react";
import useIdleLogout from "../hooks/useIdleLogout";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import HelpModal from '../components/HelpModal';

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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  const [userName, setUserName] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoadRef = useRef(true);
  const [helpOpen, setHelpOpen] = useState(false);
  useIdleLogout({ timeoutMs: 3 * 60 * 1000, enabled: true, message: 'You were logged out due to inactivity' });

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

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      <header className={`flex items-center justify-between px-8 py-4 ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: 'linear-gradient(90deg, #e3eaf6 0%, #f7f6f2 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className={`material-icons text-2xl ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>dashboard</span>
          <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>Billing Hub</span>
        </div>
  <button className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#e3eaf6] hover:bg-[#d1d8e6]'}`} onClick={() => setDarkMode((prev) => !prev)}>
          <span className={`material-icons text-xl ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </header>

      <section className="mx-auto w-full max-w-2xl mt-8 p-2">
  {loading ? (
          <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
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
            <h2 className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-[#7c7c7c]'}`}>Hello, {userName || "User"}</h2>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-[#b1b1b1]'}`}>Welcome back!</p>
          </div>
        </div>

        <a href="/ads" className="block relative rounded-2xl overflow-hidden shadow mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <img src="/background/1.png" alt="Ads" className="w-full h-28 object-cover" />
          <div className={`absolute inset-0 flex items-center justify-between px-6 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`}>
            <span className="text-white text-2xl font-bold">Ads</span>
            <span className={`rounded-full p-2 ${darkMode ? 'bg-gray-800' : 'bg-white/70'}`}>
              <span className={`material-icons text-lg ${darkMode ? 'text-yellow-200' : 'text-[#7c7c7c]'}`}>chevron_right</span>
            </span>
          </div>
        </a>

  <div className="grid grid-cols-2 gap-4 mb-8">
          {getLatestBillsByType(bills).length === 0 ? (
            <div className="col-span-2 text-center text-gray-500">No bills found.</div>
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
                  <span className={`text-lg font-bold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}</span>
                  <span className={`text-xl font-bold mt-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>${bill.amount}</span>
                  <span className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{bill.status}</span>
                </a>
              );
            })
          )}
        </div>
  </>
  )}
      </section>

      <footer className={`mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner ${darkMode ? 'bg-gray-900' : ''}`} style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: '#f7f6f2' }}>
        <button onClick={() => setHelpOpen(true)} className={`flex items-center gap-2 ${darkMode ? 'text-blue-400 hover:text-white' : 'text-[#7c7c7c] hover:text-blue-700'}`}>
          <span className="material-icons">support_agent</span>
          Support
        </button>
        <button className={`flex items-center gap-2 ${darkMode ? 'text-red-400 hover:text-red-200 font-bold' : 'text-[#e74c3c] hover:text-red-800 font-bold'}`} onClick={() => {
          try {
            sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: 'Logged out successfully' }));
          } catch {}
          localStorage.removeItem("userPhone");
          try { sessionStorage.removeItem("userPhone"); } catch {}
          window.location.href = "/";
        }}>
          <span className="material-icons">logout</span>
          Logout
        </button>
      </footer>
      {/* Support modal: show WhatsApp on authenticated pages */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        showWhatsApp
        whatsappNumber={(localStorage.getItem('supportWhatsApp') || '9647700000000')}
        whatsappMessage={`Hello, I need help with my account. User: ${userName || 'User'} | Phone: ${(localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '')}`}
      />
    </div>
  );
};

export default Home;