"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Receipt, Loader2, CalendarDays, Tag, FileText } from "lucide-react";
import { createExpense } from "@/server/actions/billingActions";
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

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (date: string, category: ExpenseCategory) => void;
}

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "FOOD" as ExpenseCategory,
    amount: "",
    date: localDate(),
    description: "",
  });

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
    const parsed = createExpenseSchema.safeParse({
      ...formData,
      amount: formData.amount === "" ? 0 : Number(formData.amount),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    savingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await createExpense(parsed.data);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success("Expense recorded successfully!");
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
              <h2 id="expense-dialog-title" className={styles.heading}>Add an expense</h2>
              <p id="expense-dialog-description" className={styles.subtitle}>Record a purchase or bill for your mess.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close expense form" className={styles.close}><X aria-hidden="true" size={20} /></button>
        </header>

        <div className={styles.content}>
          <p className={styles.hint}>Add the details below. Everyone can see this expense in the shared ledger.</p>
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
                    <select id="expense-category" value={formData.category} onChange={(e) => {
                      const category = expenseCategoryFilterSchema.safeParse(e.target.value);
                      if (category.success && category.data !== "ALL") setFormData({ ...formData, category: category.data });
                    }} className={styles.input}>
                      {expenseCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="expense-date" className={styles.label}>Date <span aria-hidden="true">*</span></label>
                  <div className={styles.inputWrap}>
                    <CalendarDays aria-hidden="true" className={styles.inputIcon} />
                    <input type="date" id="expense-date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={styles.input} />
                  </div>
                </div>
              </div>
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
            {loading ? "Saving..." : "Save expense"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
