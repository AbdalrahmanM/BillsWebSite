import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

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

const BillsPage: React.FC = () => {
  const { service } = useParams<{ service: ServiceKey }>();
  const safeService: ServiceKey = (service as ServiceKey) || "water";

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

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
        const phone = localStorage.getItem("userPhone");
        if (!phone) {
          setBills([]);
          setLoading(false);
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
      const phone = localStorage.getItem("userPhone");
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
        <div className="absolute inset-0 bg-white/60 backdrop-blur-lg" />
      </div>

      {/* Header */}
      <header className="px-8 pt-6">
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="relative overflow-hidden rounded-3xl shadow"
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
          >
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background: `linear-gradient(90deg, ${theme.light} 0%, #ffffff 100%)`,
              }}
            />
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: theme.light }}
                >
                  <span className="material-icons" style={{ color: theme.color }}>
                    {theme.icon}
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-700">{title}</div>
                  <div className="text-sm text-gray-500">
                    Overview of your {safeService} bills
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto w-full max-w-5xl mt-8">
        <div
          className="rounded-2xl shadow p-6 bg-white/80"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Month */}
              <div className="relative" ref={monthRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow border border-gray-100 min-w-[120px] text-base font-semibold text-gray-700 hover:bg-blue-50 focus:outline-none"
                  onClick={() => {
                    setMonthOpen((v) => !v);
                    setYearOpen(false);
                    setSortOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className="material-icons text-blue-400">calendar_month</span>
                  {selectedMonth
                    ? monthOptions.find((m) => m.num === selectedMonth)?.label
                    : "months"}
                  <span className="material-icons text-gray-400 text-base">expand_more</span>
                </button>
                {monthOpen && (
                  <div className="absolute left-0 mt-2 w-full z-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        selectedMonth === "" ? "bg-blue-100" : ""
                      }`}
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
                        className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                          selectedMonth === m.num ? "bg-blue-100" : ""
                        }`}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow border border-gray-100 min-w-[120px] text-base font-semibold text-gray-700 hover:bg-blue-50 focus:outline-none"
                  onClick={() => {
                    setYearOpen((v) => !v);
                    setMonthOpen(false);
                    setSortOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className="material-icons text-blue-400">calendar_today</span>
                  {selectedYear ? selectedYear : "years"}
                  <span className="material-icons text-gray-400 text-base">expand_more</span>
                </button>
                {yearOpen && (
                  <div className="absolute left-0 mt-2 w-full z-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        selectedYear === "" ? "bg-blue-100" : ""
                      }`}
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
                          className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                            selectedYear === y ? "bg-blue-100" : ""
                          }`}
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
                  className="px-4 py-2 rounded-2xl bg-gray-200 text-base text-gray-700 font-semibold shadow hover:bg-gray-300"
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
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow border border-gray-200 min-w-[160px] text-base font-semibold text-gray-700 hover:bg-blue-50 focus:outline-none"
                  onClick={() => {
                    setSortOpen((v) => !v);
                    setMonthOpen(false);
                    setYearOpen(false);
                    setStatusOpen(false);
                  }}
                >
                  <span className="material-icons text-blue-400">sort</span>
                  {sortBy === "newest" && "Newest"}
                  {sortBy === "oldest" && "Oldest"}
                  {sortBy === "amountHigh" && "Amount: High → Low"}
                  {sortBy === "amountLow" && "Amount: Low → High"}
                  <span className="material-icons text-gray-400 text-base">expand_more</span>
                </button>
                {sortOpen && (
                  <div className="absolute left-0 mt-2 w-full z-20 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        sortBy === "newest" ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        setSortBy("newest");
                        setSortOpen(false);
                      }}
                    >
                      Newest
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        sortBy === "oldest" ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        setSortBy("oldest");
                        setSortOpen(false);
                      }}
                    >
                      Oldest
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        sortBy === "amountHigh" ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        setSortBy("amountHigh");
                        setSortOpen(false);
                      }}
                    >
                      Amount: High → Low
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-blue-50 text-gray-700 font-semibold ${
                        sortBy === "amountLow" ? "bg-blue-100" : ""
                      }`}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow border border-gray-200 min-w-[120px] text-base font-semibold text-gray-700 hover:bg-green-50 focus:outline-none"
                  onClick={() => {
                    setStatusOpen((v) => !v);
                    setMonthOpen(false);
                    setYearOpen(false);
                    setSortOpen(false);
                  }}
                >
                  <span className="material-icons text-green-400">check_circle</span>
                  {statusFilter === "all" && "All"}
                  {statusFilter === "paid" && "Paid"}
                  {statusFilter === "unpaid" && "Unpaid"}
                  <span className="material-icons text-gray-400 text-base">expand_more</span>
                </button>
                {statusOpen && (
                  <div className="absolute left-0 mt-2 w-full z-20 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-green-50 text-gray-700 font-semibold ${
                        statusFilter === "all" ? "bg-green-100" : ""
                      }`}
                      onClick={() => {
                        setStatusFilter("all");
                        setStatusOpen(false);
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-green-50 text-gray-700 font-semibold ${
                        statusFilter === "paid" ? "bg-green-100" : ""
                      }`}
                      onClick={() => {
                        setStatusFilter("paid");
                        setStatusOpen(false);
                      }}
                    >
                      Paid
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 rounded-2xl hover:bg-green-50 text-gray-700 font-semibold ${
                        statusFilter === "unpaid" ? "bg-green-100" : ""
                      }`}
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
            <div className="text-center text-gray-500 py-8">Loading bills...</div>
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
                    <div className="rounded-3xl bg-white/70 backdrop-blur p-6 shadow-xl flex flex-col gap-4 min-h-[260px]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="material-icons" style={{ color: theme.color }}>
                            {theme.icon}
                          </span>
                          <div>
                            <div className="text-xs text-gray-500">Amount</div>
                            <div className="text-3xl font-extrabold text-gray-800">
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
                        <div className="px-3 py-2 rounded-xl bg-gray-100/70 text-gray-700 font-medium">
                          Bill: <span className="font-semibold break-all">{bill.billId}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-gray-100/70 text-gray-700 font-medium">
                          Date: <span className="font-semibold">{formatDate(bill.dueDate)}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-gray-100/70 text-gray-700 font-medium">
                          Year: <span className="font-semibold">{bill.year}</span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-gray-100/70 text-gray-700 font-medium">
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
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >
              <span className="material-icons">close</span>
            </button>

            <div className="mb-4 flex items-center gap-3">
              <span className="material-icons text-3xl" style={{ color: theme.color }}>
                {theme.icon}
              </span>
              <span className="text-2xl font-bold">Bill Details</span>
            </div>

            <div className="mb-2 text-lg font-semibold text-gray-700">
              Amount: ${selectedBill.amount}
            </div>
            <div className="mb-2 text-gray-700">Bill ID: {selectedBill.billId}</div>
            <div className="mb-2 text-gray-700">Date: {formatDate(selectedBill.dueDate)}</div>
            <div className="mb-2 text-gray-700">Year: {selectedBill.year}</div>
            <div className="mb-2 text-gray-700">Month: {selectedBill.month}</div>
            <div className="mb-2 text-gray-700">
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
                className="px-5 py-2 rounded-xl bg-green-500 text-white font-bold shadow hover:bg-green-600"
                onClick={() => {
                  /* TODO: integrate payment */
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
              <div className="mt-4 text-center font-semibold text-lg text-blue-600">
                {requestStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="mt-auto px-8 py-4 flex items-center justify-between rounded-t-2xl shadow-inner"
        style={{ background: "#f7f6f2" }}
      >
        <button className="flex items-center gap-2 text-[#7c7c7c] hover:text-blue-700">
          <span className="material-icons">support_agent</span>
          Support
        </button>
        <button
          className="flex items-center gap-2 text-[#e74c3c] hover:text-red-800 font-bold"
          onClick={() => {
            localStorage.removeItem("userPhone");
            window.location.href = "/";
          }}
        >
          <span className="material-icons">logout</span>
          Logout
        </button>
      </footer>
    </div>
  );
};

export default BillsPage;
