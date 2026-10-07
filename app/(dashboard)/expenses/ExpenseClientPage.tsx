"use client";

import { useState, useTransition } from "react";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import { Receipt, Plus, Search, Calendar, Filter, Trash2, ShoppingCart, Zap, Wifi, Home, Wrench } from "lucide-react";
import { getExpenses, deleteExpense } from "@/server/actions/billingActions";
import { toast } from "sonner";

interface ExpenseClientPageProps {
  initialExpenses: any[];
  initialTotal: number;
  initialMonth: string;
  currentUserRole: string;
}

export default function ExpenseClientPage({
  initialExpenses,
  initialTotal,
  initialMonth,
  currentUserRole,
}: ExpenseClientPageProps) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [totalAmount, setTotalAmount] = useState<number>(initialTotal);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleRefresh = async () => {
    startTransition(async () => {
      const res = await getExpenses(selectedMonth, categoryFilter);
      setExpenses(res.expenses);
      setTotalAmount(res.totalAmount);
    });
  };

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    startTransition(async () => {
      const res = await getExpenses(monthStr, categoryFilter);
      setExpenses(res.expenses);
      setTotalAmount(res.totalAmount);
    });
  };

  const handleCategoryChange = (catStr: string) => {
    setCategoryFilter(catStr);
    startTransition(async () => {
      const res = await getExpenses(selectedMonth, catStr);
      setExpenses(res.expenses);
      setTotalAmount(res.totalAmount);
    });
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
    } catch (err: any) {
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
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-purple-400" />
            Mess Expenses Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily bazaar spending, utility bills, and mess operational expenses.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        )}
      </div>

      {/* Total Expense Summary Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Month Expenses ({selectedMonth})</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">৳{totalAmount.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Total recorded costs for selected month</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Month Picker & Category Filter */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          
          <div className="relative flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer w-full"
            />
          </div>

          <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-300">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
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

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No expenses logged for this period.
          </div>
        ) : (
          filteredExpenses.map((e) => (
            <div key={e.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{e.title}</h3>
                  {e.description && <p className="text-xs text-slate-400 mt-1">{e.description}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-purple-400 text-lg">৳{e.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(e.category)}
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(e.date).toISOString().split("T")[0]}
                  </span>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleDelete(e.id, e.title)}
                    disabled={deletingId === e.id}
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
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No expenses logged for this period.
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

                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(e.date).toISOString().split("T")[0]}
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-white text-base">
                      ৳{e.amount.toLocaleString()}
                    </td>

                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(e.id, e.title)}
                          disabled={deletingId === e.id}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
