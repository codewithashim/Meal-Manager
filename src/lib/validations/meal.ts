import { z } from "zod";

export const mealDateSchema = z.iso.date().refine((date) => Number(date.slice(0, 4)) >= 1000, "Invalid date.");
export const mealMonthSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, "Invalid month.");

export const saveMealRecordSchema = z.object({
  userId: z.string().min(1),
  date: mealDateSchema,
  breakfast: z.number().min(0).default(0),
  lunch: z.number().min(0).default(0),
  dinner: z.number().min(0).default(0),
  note: z.string().optional().nullable(),
});

export type SaveMealRecordInput = z.infer<typeof saveMealRecordSchema>;

export const bulkDailyMealSchema = z.object({
  date: mealDateSchema,
  records: z.array(
    z.object({
      userId: z.string().min(1),
      breakfast: z.number().min(0),
      lunch: z.number().min(0),
      dinner: z.number().min(0),
      note: z.string().optional().nullable(),
    })
  ).min(1, "At least one meal record is required.").refine(
    (records) => new Set(records.map((record) => record.userId)).size === records.length,
    "Duplicate members are not allowed."
  ),
});

export type BulkDailyMealInput = z.infer<typeof bulkDailyMealSchema>;
