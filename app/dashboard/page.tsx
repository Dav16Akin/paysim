"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Send,
  RefreshCw,
  MoreHorizontal,
  TrendingUp,
  Loader2,
  AlertCircle,
  LogOut,
  User,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  getWallet,
  getTransactionsByUser,
  Wallet,
  Transaction,
} from "@/lib/api";
import TransferModal from "@/components/shared/TransferModal";

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string) {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Build monthly chart data from transactions
function buildChartData(transactions: Transaction[], userId: string) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const map: Record<number, { income: number; expense: number }> = {};
  for (let i = 0; i < 12; i++) map[i] = { income: 0, expense: 0 };

  transactions.forEach((tx) => {
    const month = new Date(tx.CreatedAt ?? "").getMonth();
    if (tx.ReceiverID === userId) {
      map[month].income += tx.Amount;
    } else {
      map[month].expense += tx.Amount;
    }
  });

  return months.map((month, i) => ({
    month,
    income: Math.round(map[i].income),
    expense: Math.round(map[i].expense),
  }));
}

// ────────────────────────────────────────────
// Custom Tooltip
// ────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-zinc-800 mb-1">{label}</p>
        <p className="text-emerald-600">
          Income: {formatCurrency(payload[0]?.value ?? 0)}
        </p>
        <p className="text-rose-500">
          Expense: {formatCurrency(payload[1]?.value ?? 0)}
        </p>
      </div>
    );
  }
  return null;
};

// ────────────────────────────────────────────
// Dashboard Page
// ────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  console.log(user);
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [walletData, txData] = await Promise.all([
        getWallet(user.id),
        getTransactionsByUser(user.id),
      ]);
      setWallet(walletData);
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  // Derived stats from real transactions
  const totalIncome = transactions
    .filter((tx) => tx.ReceiverID === user.id)
    .reduce((sum, tx) => sum + tx.Amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.SenderID === user.id)
    .reduce((sum, tx) => sum + tx.Amount, 0);

  const chartData = buildChartData(transactions, user.id);
  const recentTx = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.CreatedAt ?? "").getTime() -
        new Date(a.CreatedAt ?? "").getTime(),
    )
    .slice(0, 6);

  return (
    <>
      {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          onSuccess={fetchData}
        />
      )}

      <div className="min-h-screen bg-[#f4f5f4] p-6 space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">
              ⌘F
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:border-zinc-300 transition">
              <span className="font-medium">Last 7 Days</span>
              <ChevronDown size={14} />
            </button>
            <button className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:border-zinc-300 transition">
              <Calendar size={14} />
              <span>Today</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:border-zinc-300 transition">
              <Download size={14} />
              <span>Export</span>
            </button>
            <button className="relative w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center hover:border-zinc-300 transition">
              <Bell size={18} className="text-zinc-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#baff29] rounded-full" />
            </button>
            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 cursor-pointer hover:border-zinc-300 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#baff29] to-[#4caf50] flex items-center justify-center text-xs font-bold text-black">
                  {getInitials(user.name)}
                </div>
                <span className="text-sm font-medium text-zinc-700">
                  {user.name}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-zinc-400 transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown panel */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Profile header */}
                  <div className="px-4 py-3 border-b border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-900 capitalize">{user.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={15} className="text-zinc-400" />
                      View Profile
                    </button>
                  </div>

                  {/* Divider + Sign out */}
                  <div className="border-t border-zinc-100 py-1">
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 capitalize">
            Welcome Back, {(user.name ?? "").split(" ")[0] || "there"}!
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            All general information appears on this page.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="ml-auto underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Balance Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111111] text-white px-8 py-7">
          <div className="absolute top-[-60px] right-[100px] w-[250px] h-[250px] rounded-full bg-[#baff29]/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-40px] right-[200px] w-[180px] h-[180px] rounded-full bg-green-900/30 blur-2xl pointer-events-none" />
          <div className="absolute top-[-30px] right-[20px] w-[200px] h-[200px] rounded-full bg-[#1a3a00]/60 blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm font-medium">Total Balance</p>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-zinc-400" />
                  <span className="text-zinc-400 text-sm">
                    Loading balance…
                  </span>
                </div>
              ) : (
                <p className="text-4xl font-bold tracking-tight">
                  {wallet ? formatCurrency(wallet.Balance) : "—"}
                </p>
              )}
              <p className="text-zinc-400 text-sm">
                Your wallet is ready to use
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-1.5 bg-[#baff29] text-black font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#aaee18] transition cursor-pointer"
              >
                <Send size={14} />
                Send
              </button>
              <button className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/10 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-white/20 transition">
                <ArrowDownRight size={14} />
                Request
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/10 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button className="w-10 h-10 bg-white/10 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Income",
              value: isLoading ? "…" : formatCurrency(totalIncome),
              positive: true,
              sub: `${transactions.filter((t) => t.ReceiverID === user.id).length} transactions received`,
            },
            {
              label: "Total Expense",
              value: isLoading ? "…" : formatCurrency(totalExpense),
              positive: false,
              sub: `${transactions.filter((t) => t.SenderID === user.id).length} transactions sent`,
            },
            {
              label: "Net Cash Flow",
              value: isLoading
                ? "…"
                : formatCurrency(totalIncome - totalExpense),
              positive: totalIncome >= totalExpense,
              sub: "Income minus expenses",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 border border-zinc-100 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stat.positive
                        ? "bg-[#baff29]/20 text-[#2a7a00]"
                        : "bg-rose-50 text-rose-500"
                    }`}
                  >
                    {stat.positive ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    {stat.label}
                  </span>
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart + Cash Flow Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Transactions Chart */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-zinc-100">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-zinc-900">
                  Transactions History
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Income vs Expenses this year
                </p>
              </div>
              <div className="flex items-center gap-1">
                {["1W", "1M", "6M", "1Y"].map((p) => (
                  <button
                    key={p}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                      p === "1Y"
                        ? "bg-[#baff29] text-black"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button className="ml-2 flex items-center gap-1 text-xs text-zinc-500 border border-zinc-200 px-2.5 py-1 rounded-lg hover:border-zinc-300 transition">
                  <TrendingUp size={12} /> Filter
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[220px] mt-4 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-zinc-300" />
              </div>
            ) : (
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="incomeGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#baff29"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#baff29"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="expenseGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f43f5e"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f43f5e"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#baff29"
                      strokeWidth={2.5}
                      fill="url(#incomeGrad)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#expenseGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#baff29]" />
                <span className="text-xs text-zinc-500">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-xs text-zinc-500">Expense</span>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900">Cash Flow</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-zinc-300" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-zinc-900">
                  {formatCurrency(totalIncome - totalExpense)}
                </p>
                <p className="text-xs text-zinc-400 mt-1">net balance</p>

                <div className="mt-6 space-y-4">
                  {/* Money In */}
                  <div className="border border-zinc-100 rounded-xl p-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(totalIncome)}
                    </p>
                    <p className="text-xs text-zinc-400 mb-2">Total received</p>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#baff29] rounded-full transition-all duration-700"
                        style={{
                          width:
                            totalIncome + totalExpense > 0
                              ? `${Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 text-right">
                      {totalIncome + totalExpense > 0
                        ? `${Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}% money in`
                        : "no data"}
                    </p>
                  </div>

                  {/* Money Out */}
                  <div className="border border-zinc-100 rounded-xl p-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(totalExpense)}
                    </p>
                    <p className="text-xs text-zinc-400 mb-2">Total sent</p>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-700"
                        style={{
                          width:
                            totalIncome + totalExpense > 0
                              ? `${Math.round((totalExpense / (totalIncome + totalExpense)) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 text-right">
                      {totalIncome + totalExpense > 0
                        ? `${Math.round((totalExpense / (totalIncome + totalExpense)) * 100)}% money out`
                        : "no data"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900">Recent Activity</h3>
            <div className="flex items-center gap-1">
              {["1W", "1M", "6M", "1Y"].map((p) => (
                <button
                  key={p}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    p === "1W"
                      ? "bg-[#baff29] text-black"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-zinc-300" />
            </div>
          ) : recentTx.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
              <TrendingUp size={32} className="opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  {["Type", "Amount", "Description", "From / To", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {recentTx.map((tx) => {
                  const isIncoming = tx.ReceiverID === user.id;
                  return (
                    <tr key={tx.ID} className="hover:bg-zinc-50/50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isIncoming
                                ? "bg-[#baff29]/20 text-[#2a7a00]"
                                : "bg-rose-50 text-rose-500"
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownRight size={14} />
                            ) : (
                              <Send size={14} />
                            )}
                          </div>
                          <span className="font-medium text-zinc-800">
                            {isIncoming ? "Received" : "Sent"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            isIncoming ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {isIncoming ? "+" : "-"}
                          {formatCurrency(tx.Amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-500 text-xs max-w-[160px] truncate">
                        {tx.Description || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-[10px] font-bold text-white">
                            {(isIncoming ? tx.SenderID : tx.ReceiverID)
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-zinc-500 text-xs font-mono">
                            {isIncoming ? tx.SenderID : tx.ReceiverID}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 text-xs whitespace-nowrap">
                        {formatDate(tx.CreatedAt ?? "")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
