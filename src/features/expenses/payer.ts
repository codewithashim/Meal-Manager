// Single source of truth for "whose money was this?", shared by expenses, bills and profiles.

export interface PayableExpense {
  category: string;
  createdBy: string;
  memberId?: string | null;
  paidFromMessFund?: boolean | null;
}

// The member who paid out of pocket, or null when the mess fund paid.
export function expensePayerId(expense: PayableExpense): string | null {
  if (expense.paidFromMessFund) return null;
  return expense.memberId ?? expense.createdBy;
}

// Bazaar (food) bought with a member's own money is credited against that member's bill.
export function bazaarCreditTo(expense: PayableExpense): string | null {
  return expense.category === "FOOD" ? expensePayerId(expense) : null;
}

export function sumBazaarByMember(expenses: (PayableExpense & { amount: number })[]) {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const payer = bazaarCreditTo(e);
    if (payer) totals.set(payer, (totals.get(payer) || 0) + e.amount);
  }
  return totals;
}
