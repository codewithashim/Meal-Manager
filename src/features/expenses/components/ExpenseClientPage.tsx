"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import ExpenseModal, { type EditableExpense } from "@/features/expenses/components/ExpenseModal";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  ShoppingCart,
  Zap,
  Wifi,
  Home,
  Wrench,
  Wallet,
  Users,
  Landmark,
} from "lucide-react";
import { getExpenses, deleteExpense } from "@/server/actions/billingActions";
import { toast } from "sonner";
import MonthSelector from "@/shared/components/ui/MonthSelector";
import { setMonthInUrl } from "@/shared/hooks/useMonthParam";
import { formatMonthLabel } from "@/lib/month";
import type { ExpenseScope } from "@/lib/validations/billing";

type ExpenseResult = Awaited<ReturnType<typeof getExpenses>>;
type ExpenseRow = ExpenseResult["expenses"][number];

interface ExpenseClientPageProps {
  initialExpenses: ExpenseResult["expenses"];
  initialTotal: number;
  initialSummary: ExpenseResult["summary"];
  initialMonth: string;
  currentUserRole: string;
  currentUserId: string;
  payers: { id: string; name: string }[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const taka = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export default function ExpenseClientPage({
  initialExpenses,
  initialTotal,
  initialSummary,
  initialMonth,
  currentUserRole,
  currentUserId,
  payers,
  canCreate,
  canEdit,
  canDelete,
}: ExpenseClientPageProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [totalAmount, setTotalAmount] = useState<number>(initialTotal);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [scope, setScope] = useState<ExpenseScope>("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableExpense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);
  const filters = useRef({ month: initialMonth, category: "ALL", scope: "ALL" as ExpenseScope });

  const [isPending, startTransition] = useTransition();
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditing(null);
  }, []);

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";
  const isOwn = (e: ExpenseRow) => e.createdBy === currentUserId;
  const canDeleteExpense = (e: ExpenseRow) => canDelete && (canManage || isOwn(e));
  const canEditExpense = (e: ExpenseRow) => canEdit && (canManage || (isOwn(e) && e.category === "FOOD"));

  const fetchExpenses = () => {
    const request = ++requestId.current;
    const { month, category, scope: view } = filters.current;
    setLoadError(false);
    startTransition(async () => {
      try {
        const res = await getExpenses(month, category, view);
        if (request === requestId.current) {
          setExpenses(res.expenses);
          setTotalAmount(res.totalAmount);
          setSummary(res.summary);
        }
      } catch {
        if (request === requestId.current) {
          setLoadError(true);
          toast.error("Could not load expenses. Please try again.");
        }
      }
    });
  };

  const handleMonthChange = (monthStr: string) => {
    if (!monthStr) return;
    filters.current.month = monthStr;
    setSelectedMonth(monthStr);
    setMonthInUrl(monthStr);
    fetchExpenses();
  };

  const handleCategoryChange = (catStr: string) => {
    filters.current.category = catStr;
    setCategoryFilter(catStr);
    fetchExpenses();
  };

  const handleScopeChange = (next: ExpenseScope) => {
    filters.current.scope = next;
    setScope(next);
    fetchExpenses();
  };

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (e: ExpenseRow) => {
    setEditing({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: new Date(e.date).toISOString().slice(0, 10),
      description: e.description,
      payerId: e.payerId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete expense "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await deleteExpense(id);
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success("Deleted expense.");
        fetchExpenses();
      }
    } catch {
      toast.error("Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExpenses = expenses.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
  const topBazaar = summary.bazaarByMember[0]?.amount || 0;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "FOOD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShoppingCart className="w-3 h-3" /> Food & Bazaar
          </span>
        );
      case "ELECTRICITY":
      case "GAS":
      case "WATER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Zap className="w-3 h-3" /> {category.charAt(0) + category.slice(1).toLowerCase()}
          </span>
        );
      case "INTERNET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Wifi className="w-3 h-3" /> Internet
          </span>
        );
      case "RENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Home className="w-3 h-3" /> Rent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Wrench className="w-3 h-3" /> {category.replace("_", " ")}
          </span>
        );
    }
  };

  const paidByCell = (e: ExpenseRow) => (
    <div>
      <div className={`font-semibold text-xs ${e.payerId ? (e.payerId === currentUserId ? "text-emerald-400" : "text-blue-400") : "text-slate-400"}`}>
        {e.payerId === currentUserId ? "You" : e.payerName}
      </div>
      {e.createdBy !== e.payerId && (
        <div className="text-[11px] text-slate-500">Logged by {e.createdBy === currentUserId ? "you" : e.creatorName}</div>
      )}
    </div>
  );

  const rowActions = (e: ExpenseRow, size: "sm" | "lg") => {
    const pad = size === "lg" ? "p-2 rounded-xl" : "p-2 rounded-lg";
    return (
      <div className="flex items-center justify-end gap-1.5">
        {canEditExpense(e) && (
          <button
            onClick={() => openEdit(e)}
            disabled={deletingId !== null}
            aria-label={`Edit ${e.title}`}
            title="Edit expense"
            className={`${pad} bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {canDeleteExpense(e) && (
          <button
            onClick={() => handleDelete(e.id, e.title)}
            disabled={deletingId !== null}
            aria-label={`Delete ${e.title}`}
            title="Delete expense"
            className={`${pad} bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            Bazaar & Mess Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {canManage
              ? "Log bazaar and mess bills for the month. Bazaar is credited to whoever paid."
              : "Log the bazaar you buy each month. It is credited to your monthly bill."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <MonthSelector value={selectedMonth} onChange={handleMonthChange} className="w-full sm:w-auto justify-between" />
          {canCreate && (
            <button
              onClick={openCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {canManage ? "Log bazaar / expense" : "Add my bazaar"}
            </button>
          )}
        </div>
      </div>

      {/* Month summary */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <SummaryCard
          icon={Wallet}
          label="My bazaar"
          value={taka(summary.myBazaar)}
          hint={
            <>
              Credited to your {formatMonthLabel(selectedMonth)} bill ·{" "}
              <Link href={`/profile?month=${selectedMonth}`} className="text-emerald-400 hover:underline">
                see my bill
              </Link>
            </>
          }
          accent
        />
        <SummaryCard
          icon={ShoppingCart}
          label="Mess bazaar"
          value={taka(summary.bazaarTotal)}
          hint={
            summary.bazaarFromFund > 0
              ? `Sets the meal rate · ${taka(summary.bazaarFromFund)} from mess fund`
              : "All food spending; this sets the meal rate"
          }
        />
        <SummaryCard
          icon={Landmark}
          label="Mess bills & other"
          value={taka(summary.otherTotal)}
          hint={`Utilities, rent and staff · ${taka(summary.messTotal)} spent in total`}
        />
      </div>

      {/* Bazaar by member */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" /> Bazaar by member — {formatMonthLabel(selectedMonth)}
        </h2>
        {summary.bazaarByMember.length === 0 ? (
          <p className="text-xs text-slate-500 mt-3">Nobody has logged bazaar for this month yet.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
            {summary.bazaarByMember.map((m) => (
              <li key={m.memberId} className="text-xs">
                <div className="flex justify-between gap-3">
                  <span className={m.memberId === currentUserId ? "font-bold text-emerald-400" : "text-slate-300"}>
                    {m.memberId === currentUserId ? `${m.name} (you)` : m.name}
                  </span>
                  <span className="font-semibold text-white">{taka(m.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.memberId === currentUserId ? "bg-emerald-500" : "bg-slate-500"}`}
                    style={{ width: `${topBazaar > 0 ? Math.max(4, (m.amount / topBazaar) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div role="tablist" aria-label="Whose expenses" className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shrink-0">
          {(["ALL", "MINE"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={scope === v}
              onClick={() => handleScopeChange(v)}
              className={`flex-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                scope === v ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {v === "ALL" ? "Everyone" : "Paid by me"}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            aria-label="Search expense title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            aria-label="Expense category"
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL" className="bg-slate-900">All Categories</option>
            <option value="FOOD" className="bg-slate-900">Food & Bazaar</option>
            <option value="ELECTRICITY" className="bg-slate-900">Electricity</option>
            <option value="GAS" className="bg-slate-900">Gas</option>
            <option value="WATER" className="bg-slate-900">Water</option>
            <option value="INTERNET" className="bg-slate-900">Internet</option>
            <option value="RENT" className="bg-slate-900">Rent</option>
            <option value="MAINTENANCE" className="bg-slate-900">Maintenance</option>
            <option value="CLEANING" className="bg-slate-900">Cleaning</option>
            <option value="STAFF_SALARY" className="bg-slate-900">Staff Salary</option>
            <option value="OTHER" className="bg-slate-900">Other</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-3">
        Showing {filteredExpenses.length} {filteredExpenses.length === 1 ? "entry" : "entries"} ·{" "}
        <span className="font-semibold text-white">{taka(totalAmount)}</span> for the selected filters
      </p>

      {isPending ? (
        <div role="status" className="glass-card rounded-2xl p-8 text-center text-slate-400">Loading expenses...</div>
      ) : loadError ? (
        <div role="alert" className="glass-card rounded-2xl p-8 text-center text-slate-400">
          Could not load expenses.{" "}
          <button type="button" onClick={fetchExpenses} className="text-emerald-400 underline cursor-pointer">Try again</button>
        </div>
      ) : (
        <>
          {/* Mobile cards (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredExpenses.length === 0 ? (
              <EmptyState search={search} scope={scope} />
            ) : (
              filteredExpenses.map((e) => (
                <div key={e.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 break-words">
                      <h3 className="font-bold text-white text-base leading-tight">{e.title}</h3>
                      <div className="mt-1">{paidByCell(e)}</div>
                      {e.description && <p className="text-xs text-slate-400 mt-1">{e.description}</p>}
                    </div>
                    <span className="font-extrabold text-emerald-400 text-lg shrink-0">{taka(e.amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(e.category)}
                      <span className="font-mono text-[11px] text-slate-500">{new Date(e.date).toISOString().slice(0, 10)}</span>
                    </div>
                    {rowActions(e, "lg")}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table (≥ md) */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Title / Note</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Paid by</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <EmptyState search={search} scope={scope} bare />
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{e.title}</div>
                          {e.description && <div className="text-xs text-slate-400">{e.description}</div>}
                        </td>
                        <td className="px-6 py-4">{getCategoryBadge(e.category)}</td>
                        <td className="px-6 py-4">{paidByCell(e)}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{new Date(e.date).toISOString().slice(0, 10)}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-emerald-400 text-base">{taka(e.amount)}</td>
                        <td className="px-6 py-4 text-right">{rowActions(e, "sm")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(canCreate || canEdit) && isModalOpen && (
        <ExpenseModal
          key={editing?.id ?? "new"}
          isOpen={isModalOpen}
          month={selectedMonth}
          canManage={canManage}
          currentUserId={currentUserId}
          payers={payers}
          expense={editing}
          onClose={closeModal}
          onSuccess={(date, category) => {
            const { month, category: cat } = filters.current;
            if (date.slice(0, 7) !== month || (cat !== "ALL" && cat !== category)) {
              toast.info("Saved, but it is outside the selected month or category filter.");
            }
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 sm:p-5 border ${accent ? "border-emerald-500/30" : "border-slate-800"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? "text-emerald-400" : "text-slate-500"}`} />
      </div>
      <div className={`text-2xl font-extrabold mt-2 ${accent ? "text-emerald-400" : "text-white"}`}>{value}</div>
      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{hint}</p>
    </div>
  );
}

function EmptyState({ search, scope, bare }: { search: string; scope: ExpenseScope; bare?: boolean }) {
  const text = search
    ? "No expenses match your search."
    : scope === "MINE"
      ? "You haven't paid for any bazaar or expenses this month."
      : "No expenses logged for this month.";
  return <div className={`${bare ? "" : "glass-card rounded-2xl border border-slate-800 "}p-8 text-center text-slate-500`}>{text}</div>;
}
