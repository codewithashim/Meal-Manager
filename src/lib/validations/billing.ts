import { z } from "zod";
import { mealDateSchema, mealMonthSchema } from "@/lib/validations/meal";

export const expenseCategories = [
  "FOOD",
  "GAS",
  "ELECTRICITY",
  "WATER",
  "INTERNET",
  "RENT",
  "MAINTENANCE",
  "CLEANING",
  "STAFF_SALARY",
  "OTHER",
] as const;

export const createExpenseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  category: z.enum(expenseCategories),
  amount: z.number().positive("Amount must be greater than 0"),
  date: mealDateSchema,
  description: z.string().optional().nullable(),
  // Managers only: who paid. Members are always recorded as paying for their own bazaar.
  memberId: z.string().regex(/^[0-9a-f]{24}$/i, "Invalid member.").optional().nullable(),
  paidFromMessFund: z.boolean().optional(),
});

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;

export const expenseScopeSchema = z.enum(["ALL", "MINE"]);
export type ExpenseScope = z.infer<typeof expenseScopeSchema>;
export const expenseMonthSchema = mealMonthSchema;
export const expenseCategoryFilterSchema = z.union([z.literal("ALL"), z.enum(expenseCategories)]);
export const expenseIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Invalid expense ID.");

export const paymentMethods = ["CASH", "BANK", "BKASH", "NAGAD", "OTHER"] as const;

export const recordPaymentSchema = z.object({
  userId: z.string().min(1, "Member selection is required"),
  amount: z.number().positive("Payment amount must be greater than 0"),
  date: mealDateSchema,
  month: mealMonthSchema,
  paymentMethod: z.enum(paymentMethods).default("CASH"),
  transactionId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
