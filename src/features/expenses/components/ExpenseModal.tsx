"use client";

import { getDefaultDateForMonth, getMessDateStr, getMonthDayBounds } from "@/lib/month";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Receipt, Loader2, CalendarDays, Tag, FileText, UserRound } from "lucide-react";
import { createExpense, updateExpense } from "@/server/actions/billingActions";
import { createExpenseSchema, expenseCategories, expenseCategoryFilterSchema } from "@/lib/validations/billing";
import { toast } from "sonner";
import styles from "./ExpenseModal.module.css";

type ExpenseCategory = typeof expenseCategories[number];

const categoryLabels: Record<ExpenseCategory, string> = {
  FOOD: "Food & bazaar",
  GAS: "Gas",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  INTERNET: "Internet",
  RENT: "Rent",
  MAINTENANCE: "Maintenance",
  CLEANING: "Cleaning",
  STAFF_SALARY: "Staff salary",
  OTHER: "Other",
};

const MESS_FUND = "MESS_FUND";

export interface EditableExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string | null;
  payerId: string | null;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (date: string, category: ExpenseCategory) => void;
  // The month the ledger is showing; the date defaults into it so new entries land where the user is looking.
  month: string;
  // Managers log any category and choose who paid; members only log their own bazaar.
  canManage: boolean;
  currentUserId: string;
  payers: { id: string; name: string }[];
  expense?: EditableExpense | null;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  month,
  canManage,
  currentUserId,
  payers,
  expense,
}: ExpenseModalProps) {
  const isEditing = !!expense;
  const { first: monthFirstDay, last: monthLastDay } = getMonthDayBounds(month);
  const todayStr = getMessDateStr();
  const maxDay = monthLastDay < todayStr ? monthLastDay : todayStr;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: expense?.title ?? "",
    category: (expense?.category ?? "FOOD") as ExpenseCategory,
    amount: expense ? String(expense.amount) : "",
    date: expense?.date ?? getDefaultDateForMonth(month),
    description: expense?.description ?? "",
    payer: expense ? expense.payerId ?? MESS_FUND : currentUserId,
  });
  const isBazaar = formData.category === "FOOD";
  // Make sure the current payer is selectable even if they are no longer an active member.
  const payerOptions = payers.some((p) => p.id === formData.payer) || formData.payer === MESS_FUND
    ? payers
    : [{ id: formData.payer, name: formData.payer === currentUserId ? "Me" : "Original payer" }, ...payers];

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const { payer, ...fields } = formData;
    const parsed = createExpenseSchema.safeParse({
      ...fields,
      category: canManage ? fields.category : "FOOD",
      amount: fields.amount === "" ? 0 : Number(fields.amount),
      memberId: canManage && isBazaar && payer !== MESS_FUND ? payer : null,
      paidFromMessFund: canManage && isBazaar ? payer === MESS_FUND : false,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    savingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = expense ? await updateExpense(expense.id, parsed.data) : await createExpense(parsed.data);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        toast.success(expense ? "Expense updated." : isBazaar ? "Bazaar added to your monthly credit." : "Expense recorded.");
        onSuccess(parsed.data.date, parsed.data.category);
        onClose();
      }
    } catch {
      setError("Could not save your expense. Please try again.");
    } finally {
      savingRef.current = false;
      setLoading(false);
    }
  };

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={() => { if (!savingRef.current) onClose(); }} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" aria-describedby="expense-dialog-description" tabIndex={-1} className={styles.drawer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}><Receipt aria-hidden="true" size={22} /></div>
            <div>
              <h2 id="expense-dialog-title" className={styles.heading}>
                {isEditing ? "Edit expense" : canManage ? "Add an expense" : "Add my bazaar"}
              </h2>
              <p id="expense-dialog-description" className={styles.subtitle}>
                {canManage ? "Record bazaar or a mess bill for this month." : "Money you spend on bazaar is credited to your monthly bill."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close expense form" className={styles.close}><X aria-hidden="true" size={20} /></button>
        </header>

        <div className={styles.content}>
          <p className={styles.hint}>
            {canManage
              ? "Bazaar paid by a member is credited to that member's bill. Bazaar paid from the mess fund credits no one."
              : "Everyone can see this in the shared ledger. Utility bills are recorded by the manager."}
          </p>
          {error && <div role="alert" className={styles.error}>{error}</div>}
          <form id="expense-drawer-form" onSubmit={handleSubmit}>
            <fieldset disabled={loading} className={styles.fields}>
              <div>
                <label htmlFor="expense-title" className={styles.label}>What was it for? <span aria-hidden="true">*</span></label>
                <div className={styles.inputWrap}>
                  <FileText aria-hidden="true" className={styles.inputIcon} />
                  <input id="expense-title" type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Vegetables and rice" className={styles.input} />
                </div>
              </div>

              <div>
                <label htmlFor="expense-amount" className={styles.label}>How much did you spend? <span aria-hidden="true">*</span></label>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true" className={styles.currency}>৳</span>
                  <input id="expense-amount" type="number" inputMode="decimal" min="0" step="any" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className={styles.input} />
                </div>
                <p className={styles.help}>Enter the total amount in taka.</p>
              </div>

              <div className={styles.fieldGrid}>
                <div>
                  <label htmlFor="expense-category" className={styles.label}>Category <span aria-hidden="true">*</span></label>
                  <div className={styles.inputWrap}>
                    <Tag aria-hidden="true" className={styles.inputIcon} />
                    {canManage ? (
                      <select id="expense-category" value={formData.category} onChange={(e) => {
                        const category = expenseCategoryFilterSchema.safeParse(e.target.value);
                        if (category.success && category.data !== "ALL") setFormData({ ...formData, category: category.data });
                      }} className={styles.input}>
                        {expenseCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                      </select>
                    ) : (
                      <input id="expense-category" value={categoryLabels.FOOD} readOnly className={styles.input} />
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="expense-date" className={styles.label}>Date <span aria-hidden="true">*</span></label>
                  <div className={styles.inputWrap}>
                    <CalendarDays aria-hidden="true" className={styles.inputIcon} />
                    <input type="date" id="expense-date" required min={monthFirstDay} max={maxDay} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={styles.input} />
                  </div>
                </div>
              </div>
              {canManage && isBazaar && (
                <div>
                  <label htmlFor="expense-payer" className={styles.label}>Who paid? <span aria-hidden="true">*</span></label>
                  <div className={styles.inputWrap}>
                    <UserRound aria-hidden="true" className={styles.inputIcon} />
                    <select id="expense-payer" value={formData.payer} onChange={(e) => setFormData({ ...formData, payer: e.target.value })} className={styles.input}>
                      {payerOptions.map((p) => <option key={p.id} value={p.id}>{p.id === currentUserId ? `${p.name} (me)` : p.name}</option>)}
                      <option value={MESS_FUND}>Mess fund (no member credit)</option>
                    </select>
                  </div>
                  <p className={styles.help}>This amount is credited to the payer&apos;s bill for the month.</p>
                </div>
              )}
              <div>
                <label htmlFor="expense-description" className={styles.label}>Notes <span className={styles.optional}>Optional</span></label>
                <textarea id="expense-description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add any useful details" className={`${styles.input} ${styles.textarea}`} />
              </div>
            </fieldset>
          </form>
        </div>

        <footer className={styles.footer}>
          <button type="button" onClick={onClose} disabled={loading} className={styles.cancel}>Cancel</button>
          <button form="expense-drawer-form" type="submit" disabled={loading} className={styles.save}>
            {loading && <Loader2 aria-hidden="true" className={styles.spinner} size={18} />}
            {loading ? "Saving..." : isEditing ? "Save changes" : "Save expense"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
