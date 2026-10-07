import { z } from "zod";

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
  title: z.string().min(2, "Title must be at least 2 characters"),
  category: z.enum(expenseCategories),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string(), // YYYY-MM-DD
  description: z.string().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const generateBillsSchema = z.object({
  month: z.string(), // YYYY-MM
  utilitySharePerMember: z.number().min(0).default(0),
  otherChargesPerMember: z.number().min(0).default(0),

  // Detailed Mess Utility Bills & Staff Salaries
  electricityBill: z.number().min(0).default(0),
  gasBill: z.number().min(0).default(0),
  waterBill: z.number().min(0).default(0),
  khalaBill: z.number().min(0).default(0),
  wifiBill: z.number().min(0).default(0),

  // Flag: if true, inputs are total mess amounts (which will be split equally among active members)
  isTotalMessBills: z.boolean().default(true),
});

export type GenerateBillsInput = z.infer<typeof generateBillsSchema>;

export const paymentMethods = ["CASH", "BANK", "BKASH", "NAGAD", "OTHER"] as const;

export const recordPaymentSchema = z.object({
  userId: z.string().min(1, "Member selection is required"),
  amount: z.number().positive("Payment amount must be greater than 0"),
  date: z.string(), // YYYY-MM-DD
  month: z.string(), // YYYY-MM
  paymentMethod: z.enum(paymentMethods).default("CASH"),
  transactionId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
