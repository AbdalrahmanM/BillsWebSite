import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import useIdleLogout from '../hooks/useIdleLogout';
import HelpModal from '../components/HelpModal';

type ServiceKey = "water" | "electricity" | "gas" | "fees";

const serviceNames: Record<ServiceKey, string> = {
  water: "Water Bills",
  electricity: "Electricity Bills",
  gas: "Gas Bills",
  fees: "Fees",
};

interface Bill {
  billId: string;
  amount: number;
  status: string; // "paid" | "unpaid"
  dueDate: any;   // Firestore Timestamp or ISO string
  month: string;  // "01".."12" or "1".."12"
  year: string;   // "2024"
}

const serviceTheme: Record<
  ServiceKey,
  { color: string; light: string; icon: string }
> = {
  water: { color: "#3b82f6", light: "#dbeafe", icon: "water_drop" },
  electricity: { color: "#a855f7", light: "#ede9fe", icon: "bolt" },
  gas: { color: "#f59e0b", light: "#fef3c7", icon: "local_fire_department" },
  fees: { color: "#10b981", light: "#d1fae5", icon: "credit_card" },
};

// Simple skeleton card shown while loading bills
const SkeletonCard: React.FC = () => {
  return (
    <div
      className="p-[2px] rounded-3xl"
      style={{
        background: "linear-gradient(135deg, #e5e7eb, #f3f4f6)",
      }}
      aria-busy="true"
      aria-label="Loading bill"
    >
      <div className="rounded-3xl bg-white/70 backdrop-blur p-6 shadow-xl flex flex-col gap-4 min-h-[260px] animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div>
              <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="h-9 rounded-xl bg-gray-200/80" />
          <div className="h-9 rounded-xl bg-gray-200/80" />
          <div className="h-9 rounded-xl bg-gray-200/80" />
          <div className="h-9 rounded-xl bg-gray-200/80" />
        </div>
      </div>
    </div>
  );
};

// Top neon progress bar while fetching
const TopProgressBar: React.FC<{ visible?: boolean }> = ({ visible = false }) => {
  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-3 pointer-events-none">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bh-progress">
          <div className="bh-progress__bar" />
          <div className="bh-progress__bar--alt" />
        </div>
      </div>
    </div>
  );
};

const BillsPage: React.FC = () => {
  const { service } = useParams<{ service: ServiceKey }>();
  const safeService: ServiceKey = (service as ServiceKey) || "water";
  const navigate = useNavigate();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useIdleLogout({ timeoutMs: 3 * 60 * 1000, enabled: true, message: 'You were logged out due to inactivity' });
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amountHigh" | "amountLow"
  >("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // '' => all
  const [selectedYear, setSelectedYear] = useState<string>(""); // '' => all

  const title = serviceNames[safeService];
  const theme = serviceTheme[safeService];
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const listener = () => setDarkMode(localStorage.getItem("darkMode") === "true");
    window.addEventListener("storage", listener);
    // also reflect class in case user lands directly here
    document.documentElement.classList.toggle("bh-dark", localStorage.getItem("darkMode") === "true");
    return () => window.removeEventListener("storage", listener);
  }, []);

  // refs for outside click
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Month options (Jan..Dec)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return {
      num,
      label: new Date(2025, i, 1).toLocaleString("en", { month: "short" }),
    };
  });

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const phone = localStorage.getItem("userPhone") || sessionStorage.getItem("userPhone");
        if (!phone) {
          setBills([]);
          setLoading(false);
          // إذا لم يكن هناك جلسة، أعد المستخدم لشاشة الدخول
          try { navigate('/'); } catch {}
          return;
        }

        // get userId
        const userQuery = query(collection(db, "Users"), where("phone", "==", phone));
        const userSnap = await getDocs(userQuery);
        if (userSnap.empty) {
          setBills([]);
          setLoading(false);
          return;
        }
        const userId = userSnap.docs[0].id;

        // get bills for service
        const billsRef = collection(db, "Users", userId, "Bills");
        const billsQuery = query(billsRef, where("type", "==", safeService));
        const billsSnap = await getDocs(billsQuery);

        const billsArr: Bill[] = billsSnap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            billId: data.billId,
            amount: Number(data.amount) || 0,
            status: data.status,
            dueDate: data.dueDate,
            month: String(data.month),
            year: String(data.year),
          };
        });

        setBills(billsArr);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [safeService]);

  // close dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (monthRef.current && !monthRef.current.contains(t)) setMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(t)) setYearOpen(false);
      if (sortRef.current && !sortRef.current.contains(t)) setSortOpen(false);
      if (statusRef.current && !statusRef.current.contains(t)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const formatDate = (d: any) => {
    const date: Date =
      d?.toDate?.() instanceof Date
        ? d.toDate()
        : typeof d === "string"
        ? new Date(d)
        : new Date();
    if (Number.isNaN(date.getTime())) return "-";
    return date.toISOString().slice(0, 10);
  };

  const filteredSorted = bills
    .filter((b) =>
      selectedMonth ? String(b.month).padStart(2, "0") === selectedMonth : true
    )
    .filter((b) => (selectedYear ? String(b.year) === String(selectedYear) : true))
    .filter((b) =>
      statusFilter === "all" ? true : statusFilter === "paid" ? b.status === "paid" : b.status !== "paid"
    )
    .sort((a, b) => {
      const dateA =
        a.dueDate?.toDate?.() instanceof Date
          ? a.dueDate.toDate().getTime()
          : new Date(a.dueDate).getTime();
      const dateB =
        b.dueDate?.toDate?.() instanceof Date
          ? b.dueDate.toDate().getTime()
          : new Date(b.dueDate).getTime();

      if (sortBy === "newest") return (dateB || 0) - (dateA || 0);
      if (sortBy === "oldest") return (dateA || 0) - (dateB || 0);
      if (sortBy === "amountHigh") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    });

  const handleRequestBill = async (bill: Bill) => {
    setRequestStatus(null);
    try {
      const phone = localStorage.getItem("userPhone") || sessionStorage.getItem("userPhone");
      if (!phone) {
        setRequestStatus("User not found");
        return;
      }

      const userQueryRef = query(collection(db, "Users"), where("phone", "==", phone));
      const userSnap = await getDocs(userQueryRef);
      if (userSnap.empty) {
        setRequestStatus("User not found");
        return;
      }
      const userId = userSnap.docs[0].id;
      const userInfo = userSnap.docs[0].data() as any;

      // check existing request for same bill
      const reqQuery = query(
        collection(db, "bill_requests"),
        where("userId", "==", userId),
        where("bill.billId", "==", bill.billId)
      );
      const reqSnap = await getDocs(reqQuery);
      if (!reqSnap.empty) {
        setRequestStatus("You have already requested this bill.");
        return;
      }

      await addDoc(collection(db, "bill_requests"), {
        userId,
        userName: userInfo?.name || "",
        userLastName: userInfo?.lastname || "",
        userPhone: userInfo?.phone || "",
        bill,
        timestamp: new Date(),
      });

      setRequestStatus("Bill request sent successfully!");
    } catch (e) {
      setRequestStatus("Something went wrong. Try again.");
    }
  };

  return (
  <div className="min-h-screen flex flex-col relative">
      {/* Blurred background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/background/login-bg.jpg')" }}
      >
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/70 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-lg'}`} />
      </div>

      {/* Header */}
      <header className={`px-8 pt-6 ${darkMode ? 'bg-gray-900/40' : ''}`}>
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="relative overflow-hidden rounded-3xl shadow"
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
          >
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background: darkMode ? 'linear-gradient(90deg, rgba(31,41,55,0.9) 0%, rgba(17,24,39,0.9) 100%)' : `linear-gradient(90deg, ${theme.light} 0%, #ffffff 100%)`,
              }}
            />
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-800' : ''}`}
                  style={{ background: darkMode ? undefined : theme.light }}
                >
                  <span className={`material-icons ${darkMode ? 'text-blue-300' : ''}`} style={{ color: darkMode ? undefined : theme.color }}>
                    {theme.icon}
                  </span>
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>{title}</div>
                  <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>
                    Overview of your {safeService} bills
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Animated expandable Home button */}
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  aria-label="Home"
                  className="HomeBtnExpand"
                >
                  <span className="icon material-icons" aria-hidden="true">home</span>
                  <span className="label">Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
    <section className="mx-auto w-full max-w-5xl mt-8">
        <div
      className={`rounded-2xl shadow p-6 ${darkMode ? 'bg-gray-900/70' : 'bg-white/80'}`}
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Month */}
              <div className="relative" ref={monthRef}>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow border min-w-[120px] text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-blue-200 hover:bg-gray-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => {
                    setMonthOpen((v) => !v);
                    setYearOpen(false);
                    setSortOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className={`material-icons ${darkMode ? 'text-blue-300' : 'text-blue-400'}`}>calendar_month</span>
                  {selectedMonth
                    ? monthOptions.find((m) => m.num === selectedMonth)?.label
                    : "months"}
                  <span className={`material-icons text-base ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>expand_more</span>
                </button>
                {monthOpen && (
                  <div className={`absolute left-0 mt-2 w-full z-20 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${selectedMonth === "" ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSelectedMonth("");
                        setMonthOpen(false);
                      }}
                    >
                      All months
                    </button>
                    {monthOptions.map((m) => (
                      <button
                        key={m.num}
                        className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${selectedMonth === m.num ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                        onClick={() => {
                          setSelectedMonth(m.num);
                          setMonthOpen(false);
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year */}
              <div className="relative" ref={yearRef}>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow border min-w-[120px] text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-blue-200 hover:bg-gray-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => {
                    setYearOpen((v) => !v);
                    setMonthOpen(false);
                    setSortOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className={`material-icons ${darkMode ? 'text-blue-300' : 'text-blue-400'}`}>calendar_today</span>
                  {selectedYear ? selectedYear : "years"}
                  <span className={`material-icons text-base ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>expand_more</span>
                </button>
                {yearOpen && (
                  <div className={`absolute left-0 mt-2 w-full z-20 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${selectedYear === '' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSelectedYear("");
                        setYearOpen(false);
                      }}
                    >
                      All years
                    </button>
                    {Array.from(new Set(bills.map((b) => String(b.year))))
                      .sort((a, b) => Number(b) - Number(a))
                      .map((y) => (
                        <button
                          key={y}
                          className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${selectedYear === y ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                          onClick={() => {
                            setSelectedYear(y);
                            setYearOpen(false);
                          }}
                        >
                          {y}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {(selectedMonth || selectedYear) && (
                <button
                  onClick={() => {
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                  className={`px-4 py-2 rounded-2xl text-base font-semibold shadow ${darkMode ? 'bg-gray-700 text-blue-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow border min-w-[160px] text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-blue-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => {
                    setSortOpen((v) => !v);
                    setMonthOpen(false);
                    setYearOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className={`material-icons ${darkMode ? 'text-blue-300' : 'text-blue-400'}`}>sort</span>
                  {sortBy === "newest" && "Newest"}
                  {sortBy === "oldest" && "Oldest"}
                  {sortBy === "amountHigh" && "Amount: High → Low"}
                  {sortBy === "amountLow" && "Amount: Low → High"}
                  <span className={`material-icons text-base ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>expand_more</span>
                </button>
                {sortOpen && (
                  <div className={`absolute left-0 mt-2 w-full z-20 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${sortBy === 'newest' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSortBy("newest");
                        setSortOpen(false);
                      }}
                    >
                      Newest
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${sortBy === 'oldest' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSortBy("oldest");
                        setSortOpen(false);
                      }}
                    >
                      Oldest
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${sortBy === 'amountHigh' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSortBy("amountHigh");
                        setSortOpen(false);
                      }}
                    >
                      Amount: High → Low
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-blue-50'} ${sortBy === 'amountLow' ? (darkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
                      onClick={() => {
                        setSortBy("amountLow");
                        setSortOpen(false);
                      }}
                    >
                      Amount: Low → High
                    </button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="relative" ref={statusRef}>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow border min-w-[120px] text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-blue-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50'}`}
                  onClick={() => {
                    setStatusOpen((v) => !v);
                    setMonthOpen(false);
                    setYearOpen(false);
                    setSortOpen(false);
                  }}
                >
                  <span className={`material-icons ${darkMode ? 'text-green-300' : 'text-green-400'}`}>check_circle</span>
                  {statusFilter === "all" && "All"}
                  {statusFilter === "paid" && "Paid"}
                  {statusFilter === "unpaid" && "Unpaid"}
                  <span className={`material-icons text-base ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>expand_more</span>
                </button>
                {statusOpen && (
                  <div className={`absolute left-0 mt-2 w-full z-20 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-green-50'} ${statusFilter === 'all' ? (darkMode ? 'bg-gray-700' : 'bg-green-100') : ''}`}
                      onClick={() => {
                        setStatusFilter("all");
                        setStatusOpen(false);
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-green-50'} ${statusFilter === 'paid' ? (darkMode ? 'bg-gray-700' : 'bg-green-100') : ''}`}
                      onClick={() => {
                        setStatusFilter("paid");
                        setStatusOpen(false);
                      }}
                    >
                      Paid
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl font-semibold ${darkMode ? 'text-blue-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-green-50'} ${statusFilter === 'unpaid' ? (darkMode ? 'bg-gray-700' : 'bg-green-100') : ''}`}
                      onClick={() => {
                        setStatusFilter("unpaid");
                        setStatusOpen(false);
                      }}
                    >
                      Unpaid
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
              <div className="w-full max-w-md">
                <div className="bh-progress">
                  <div className="bh-progress__bar" />
                  <div className="bh-progress__bar--alt" />
                </div>
              </div>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No bills found for this section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSorted.map((bill) => {
                const isPaid = bill.status === "paid";
                return (
                  <div
                    key={bill.billId}
                    className="p-[2px] rounded-3xl cursor-pointer"
                    style={{
                      background: isPaid
                        ? "linear-gradient(135deg,#93c5fd,#a7f3d0)"
                        : "linear-gradient(135deg,#fecaca,#fde68a)",
                    }}
                    onClick={() => {
                      setSelectedBill(bill);
                      setModalOpen(true);
                      setRequestStatus(null);
                    }}
                  >
                    <div className={`rounded-3xl backdrop-blur p-6 shadow-xl flex flex-col gap-4 min-h-[260px] ${darkMode ? 'bg-gray-900/60' : 'bg-white/70'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`material-icons ${darkMode ? 'text-blue-300' : ''}`} style={{ color: darkMode ? undefined : theme.color }}>
                            {theme.icon}
                          </span>
                          <div>
                            <div className={`text-xs ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>Amount</div>
                            <div className={`text-3xl font-extrabold ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>
                              ${bill.amount}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
                            isPaid ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className={`px-3 py-2 rounded-xl font-medium ${darkMode ? 'bg-gray-800/70 text-blue-200' : 'bg-gray-100/70 text-gray-700'}`}>
                          Bill: <span className="font-semibold break-all">{bill.billId}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl font-medium ${darkMode ? 'bg-gray-800/70 text-blue-200' : 'bg-gray-100/70 text-gray-700'}`}>
                          Date: <span className="font-semibold">{formatDate(bill.dueDate)}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl font-medium ${darkMode ? 'bg-gray-800/70 text-blue-200' : 'bg-gray-100/70 text-gray-700'}`}>
                          Year: <span className="font-semibold">{bill.year}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl font-medium ${darkMode ? 'bg-gray-800/70 text-blue-200' : 'bg-gray-100/70 text-gray-700'}`}>
                          Month: <span className="font-semibold">{bill.month}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {modalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`rounded-3xl shadow-xl p-8 max-w-md w-full relative ${darkMode ? 'bg-gray-900 text-blue-200' : 'bg-white'}`}>
            <button
              className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
              onClick={() => setModalOpen(false)}
            >
              <span className="material-icons">close</span>
            </button>

            <div className="mb-4 flex items-center gap-3">
              <span className={`material-icons text-3xl ${darkMode ? 'text-blue-300' : ''}`} style={{ color: darkMode ? undefined : theme.color }}>
                {theme.icon}
              </span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-blue-100' : ''}`}>Bill Details</span>
            </div>

            <div className={`mb-2 text-lg font-semibold ${darkMode ? 'text-blue-100' : 'text-gray-700'}`}>
              Amount: ${selectedBill.amount}
            </div>
            <div className={`${darkMode ? 'mb-2 text-blue-200' : 'mb-2 text-gray-700'}`}>Bill ID: {selectedBill.billId}</div>
            <div className={`${darkMode ? 'mb-2 text-blue-200' : 'mb-2 text-gray-700'}`}>Date: {formatDate(selectedBill.dueDate)}</div>
            <div className={`${darkMode ? 'mb-2 text-blue-200' : 'mb-2 text-gray-700'}`}>Year: {selectedBill.year}</div>
            <div className={`${darkMode ? 'mb-2 text-blue-200' : 'mb-2 text-gray-700'}`}>Month: {selectedBill.month}</div>
            <div className={`${darkMode ? 'mb-2 text-blue-200' : 'mb-2 text-gray-700'}`}>
              Status:{" "}
              <span
                className={
                  selectedBill.status === "paid"
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {selectedBill.status}
              </span>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                disabled={selectedBill.status === 'paid'}
                className={`px-5 py-2 rounded-xl text-white font-bold shadow ${selectedBill.status === 'paid' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                onClick={() => {
                  if (selectedBill.status === 'paid') return;
                  navigate('/pay', { state: { billId: selectedBill.billId, amount: selectedBill.amount, service: safeService } });
                }}
              >
                Pay
              </button>
              <button
                className="px-5 py-2 rounded-xl bg-blue-500 text-white font-bold shadow hover:bg-blue-600"
                onClick={() => handleRequestBill(selectedBill)}
              >
                Request Bill
              </button>
            </div>

            {requestStatus && (
              <div className={`mt-4 text-center font-semibold text-lg ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {requestStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner ${darkMode ? 'bg-gray-900' : ''}`}
        style={darkMode ? { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' } : { background: '#f7f6f2' }}
      >
        <button
          type="button"
          aria-label="Support"
          onClick={() => setHelpOpen(true)}
          className="SupBtnExpand"
        >
          <span className="icon material-icons" aria-hidden="true">support_agent</span>
          <span className="label">Support</span>
        </button>
        {/* Custom animated logout button */}
        <button
          type="button"
          aria-label="Logout"
          className="LogoutBtn"
          onClick={() => {
            try {
              sessionStorage.setItem('flashToast', JSON.stringify({ type: 'success', message: 'Logged out successfully' }));
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
          <div className="text">Logout</div>
        </button>
      </footer>
  {/* Support modal: show WhatsApp on authenticated pages */}
  <HelpModal
    open={helpOpen}
    onClose={() => setHelpOpen(false)}
    showWhatsApp
    whatsappNumber={(localStorage.getItem('supportWhatsApp') || '9647700000000')}
    whatsappMessage={`Hello, I need help with my ${safeService} bills. Bill: ${selectedBill?.billId || ''} | Phone: ${(localStorage.getItem('userPhone') || sessionStorage.getItem('userPhone') || '')}`}
  />
    </div>
  );
};

export default BillsPage;

