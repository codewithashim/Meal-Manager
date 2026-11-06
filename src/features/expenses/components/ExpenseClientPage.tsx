"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import ExpenseModal from "@/features/expenses/components/ExpenseModal";
import { Receipt, Plus, Search, Calendar, Filter, Trash2, ShoppingCart, Zap, Wifi, Home, Wrench } from "lucide-react";
import { getExpenses, deleteExpense } from "@/server/actions/billingActions";
import { toast } from "sonner";

interface ExpenseClientPageProps {
  initialExpenses: Awaited<ReturnType<typeof getExpenses>>["expenses"];
  initialTotal: number;
  initialMonth: string;
  currentUserRole: string;
  currentUserId?: string;
  canCreate: boolean;
  canDelete: boolean;
}

export default function ExpenseClientPage({
  initialExpenses,
  initialTotal,
  initialMonth,
  currentUserRole,
  currentUserId,
  canCreate,
  canDelete,
}: ExpenseClientPageProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [totalAmount, setTotalAmount] = useState<number>(initialTotal);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);
  const filters = useRef({ month: initialMonth, category: "ALL" });

  const [isPending, startTransition] = useTransition();
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const canDeleteExpense = (createdBy: string) => {
    if (!canDelete) return false;
    if (canManage) return true;
    if (currentUserId && createdBy === currentUserId) return true;
    return false;
  };

  const fetchExpenses = (month: string, category: string) => {
    const request = ++requestId.current;
    setLoadError(false);
    startTransition(async () => {
      try {
        const res = await getExpenses(month, category);
        if (request === requestId.current) {
          setExpenses(res.expenses);
          setTotalAmount(res.totalAmount);
        }
      } catch {
        if (request === requestId.current) {
          setLoadError(true);
          toast.error("Could not load expenses. Please try again.");
        }
      }
    });
  };

  const handleRefresh = () => fetchExpenses(filters.current.month, filters.current.category);

  const handleMonthChange = (monthStr: string) => {
    if (!monthStr) return;
    filters.current.month = monthStr;
    setSelectedMonth(monthStr);
    fetchExpenses(monthStr, categoryFilter);
  };

  const handleCategoryChange = (catStr: string) => {
    filters.current.category = catStr;
    setCategoryFilter(catStr);
    fetchExpenses(selectedMonth, catStr);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete expense "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await deleteExpense(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Deleted expense.`);
        handleRefresh();
      }
    } catch {
      toast.error("Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExpenses = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

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
            <Zap className="w-3 h-3" /> Utility
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

  return (
    <div className="space-y-6 animate-fadeIn pb-28 lg:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
            Mess Expenses Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily bazaar spending, utility bills, and mess operational expenses.
          </p>
        </div>

        {canCreate && <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Bazaar / Expense
        </button>}
      </div>

      {/* Total Expense Summary Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expenses ({selectedMonth})</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{isPending ? "Loading..." : loadError ? "Unavailable" : `৳${totalAmount.toLocaleString()}`}</div>
          <p className="text-xs text-slate-400 mt-1">Total for the selected month and category; title search does not change this total.</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Receipt className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
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

        {/* Month Picker & Category Filter */}
        <div className="flex flex-col min-[400px]:flex-row items-stretch gap-2 sm:gap-3 w-full md:w-auto">
          
          <div className="relative flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="month"
              aria-label="Expense month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer w-full"
            />
          </div>

          <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-300">
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

      </div>

      {isPending ? (
        <div role="status" className="glass-card rounded-2xl p-8 text-center text-slate-400">Loading expenses...</div>
      ) : loadError ? (
        <div role="alert" className="glass-card rounded-2xl p-8 text-center text-slate-400">
          Could not load expenses.{" "}
          <button type="button" onClick={handleRefresh} className="text-emerald-400 underline">Try again</button>
        </div>
      ) : <>
      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            {search ? "No expenses match your search." : "No expenses logged for this period."}
          </div>
        ) : (
          filteredExpenses.map((e) => (
            <div key={e.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 break-words">
                  <h3 className="font-bold text-white text-base leading-tight">{e.title}</h3>
                  <div className="text-xs text-blue-400 font-medium mt-0.5">Logged by: {e.creatorName}</div>
                  {e.description && <p className="text-xs text-slate-400 mt-1">{e.description}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-400 text-lg">৳{e.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(e.category)}
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(e.date).toISOString().split("T")[0]}
                  </span>
                </div>

                {canDeleteExpense(e.createdBy) && (
                  <button
                    onClick={() => handleDelete(e.id, e.title)}
                    disabled={deletingId !== null}
                    aria-label={`Delete ${e.title}`}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Title / Note</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Logged By</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {search ? "No expenses match your search." : "No expenses logged for this period."}
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

                    <td className="px-6 py-4 font-semibold text-blue-400 text-xs">
                      {e.creatorName}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(e.date).toISOString().split("T")[0]}
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-emerald-400 text-base">
                      ৳{e.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {canDeleteExpense(e.createdBy) && (
                        <button
                          onClick={() => handleDelete(e.id, e.title)}
                          disabled={deletingId !== null}
                          aria-label={`Delete ${e.title}`}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>}

      {/* Expense Modal */}
      {canCreate && isModalOpen && <ExpenseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={(date, category) => {
          if (date.slice(0, 7) !== filters.current.month || (filters.current.category !== "ALL" && filters.current.category !== category)) {
            toast.info("The expense was saved, but is outside the current month or category filter.");
          }
          handleRefresh();
        }}
      />}

    </div>
  );
}
