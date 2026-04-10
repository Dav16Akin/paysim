"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowDownRight,
  Send,
  Loader2,
  TrendingUp,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTransactionsByUser, Transaction } from "@/lib/api";

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
      month: "short",
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

type Filter = "all" | "received" | "sent";

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTransactionsByUser(user.id);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (!user) return null;

  // Filter + search
  const filtered = transactions
    .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
    .filter((tx) => {
      const isIncoming = tx.ReceiverID === user.id;
      if (filter === "received" && !isIncoming) return false;
      if (filter === "sent" && isIncoming) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          tx.ID.toLowerCase().includes(q) ||
          tx.SenderID.toLowerCase().includes(q) ||
          tx.ReceiverID.toLowerCase().includes(q) ||
          (tx.Description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });

  const totalReceived = transactions
    .filter((t) => t.ReceiverID === user.id)
    .reduce((s, t) => s + t.Amount, 0);
  const totalSent = transactions
    .filter((t) => t.SenderID === user.id)
    .reduce((s, t) => s + t.Amount, 0);

  return (
    <div className="min-h-screen bg-[#f4f5f4] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Transactions</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Your complete transaction history.</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 bg-[#baff29] text-black font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#aaee18] transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Received",
            value: formatCurrency(totalReceived),
            count: transactions.filter((t) => t.ReceiverID === user.id).length,
            positive: true,
          },
          {
            label: "Total Sent",
            value: formatCurrency(totalSent),
            count: transactions.filter((t) => t.SenderID === user.id).length,
            positive: false,
          },
          {
            label: "All Transactions",
            value: transactions.length.toString(),
            count: null,
            positive: true,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-zinc-100 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  card.positive ? "bg-[#baff29]/20 text-[#2a7a00]" : "bg-rose-50 text-rose-500"
                }`}
              >
                {card.positive ? <ArrowDownRight size={16} /> : <Send size={16} />}
              </div>
              <span className="text-sm font-medium text-zinc-600">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
            {card.count !== null && (
              <p className="text-xs text-zinc-400 mt-1">{card.count} transactions</p>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchTransactions} className="ml-auto underline font-medium">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {/* Table Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 gap-4">
          {/* Search */}
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by ID or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
            {(["all", "received", "sent"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filter === f ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-zinc-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-zinc-400">
            <TrendingUp size={36} className="opacity-30" />
            <p className="text-sm font-medium">No transactions found</p>
            {search && (
              <p className="text-xs">Try clearing your search</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                {["Type", "Amount", "Description", "Counterparty", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((tx) => {
                const isIncoming = tx.ReceiverID === user.id;
                const counterparty = isIncoming ? tx.SenderID : tx.ReceiverID;
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
                          {isIncoming ? <ArrowDownRight size={14} /> : <Send size={14} />}
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
                    <td className="px-5 py-4 text-zinc-500 text-xs max-w-[180px] truncate">
                      {tx.Description || <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-[10px] font-bold text-white">
                          {counterparty.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-zinc-500 text-xs font-mono">
                          {counterparty}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs whitespace-nowrap">
                      {formatDate(tx.CreatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
