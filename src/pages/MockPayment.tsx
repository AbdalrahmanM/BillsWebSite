import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface LocationState {
  billId: string;
  amount: number;
  service: 'water' | 'electricity' | 'gas' | 'fees';
}

const MockPayment: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { billId, amount, service } = (state || {}) as LocationState;
  const [method, setMethod] = useState<'card' | 'zain' | ''>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const darkMode = useMemo(() => localStorage.getItem('darkMode') === 'true', []);

  if (!billId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow">
          <div className="text-center">Missing payment info. Go back to bills.</div>
          <div className="mt-4 flex justify-center">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={() => navigate('/home')}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  const confirm = async () => {
    try {
      setProcessing(true);
      setError(null);
      const phone = localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone');
      if (!phone) throw new Error('User not logged in');
      const usersQ = query(collection(db, 'Users'), where('phone', '==', phone));
      const usersSnap = await getDocs(usersQ);
      if (usersSnap.empty) throw new Error('User not found');
      const userId = usersSnap.docs[0].id;

      // Find the bill doc by billId within subcollection
      const billsQ = query(collection(db, 'Users', userId, 'Bills'), where('billId', '==', billId));
      const billsSnap = await getDocs(billsQ);
      if (billsSnap.empty) throw new Error('Bill not found');
      const billDocRef = doc(db, 'Users', userId, 'Bills', billsSnap.docs[0].id);

      await updateDoc(billDocRef, { status: 'paid' });

      try {
        sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: 'Payment successful' }));
      } catch {}

      navigate(`/bills/${service}`, { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      <header className={`px-6 py-4 ${darkMode ? 'bg-gray-900' : ''}`}>
        <div className="mx-auto w-full max-w-2xl flex items-center gap-2">
          <button onClick={() => navigate(-1)} className={`rounded-full p-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-blue-200' : 'bg-white hover:bg-blue-50 text-gray-700'} shadow`}>
            <span className="material-icons">arrow_back</span>
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>Payment</h1>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl p-6">
        <div className={`rounded-2xl shadow p-6 ${darkMode ? 'bg-gray-900/70' : 'bg-white/80'}`}>
          <div className={`text-2xl font-bold mb-4 ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>Amount: ${amount}</div>
          <div className={`mb-3 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>Choose payment method:</div>

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="method" checked={method==='card'} onChange={() => setMethod('card')} />
              <span>Bank Card</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="method" checked={method==='zain'} onChange={() => setMethod('zain')} />
              <span>Zain Cash</span>
            </label>
          </div>

          {method === 'card' ? (
            <div className="grid grid-cols-1 gap-3">
              <input className="px-4 py-3 rounded-xl border outline-none" placeholder="Card Number" />
              <div className="grid grid-cols-3 gap-3">
                <input className="px-4 py-3 rounded-xl border outline-none" placeholder="MM" />
                <input className="px-4 py-3 rounded-xl border outline-none" placeholder="YYYY" />
                <input className="px-4 py-3 rounded-xl border outline-none" placeholder="CVV" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <input className="px-4 py-3 rounded-xl border outline-none" placeholder="Phone Number" />
            </div>
          )}

          {error && <div className="text-red-500 mt-4">{error}</div>}

          <button disabled={processing} onClick={confirm} className={`mt-8 w-full px-4 py-4 rounded-full font-bold flex items-center justify-center gap-2 ${processing ? 'opacity-70 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 text-blue-100 hover:bg-gray-600' : 'bg-amber-700 text-white hover:bg-amber-800'}`}>
            <span className="material-icons">credit_card</span>
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default MockPayment;
