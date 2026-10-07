import { z } from "zod";

export const saveMealRecordSchema = z.object({
  userId: z.string(),
  date: z.string(), // ISO date string YYYY-MM-DD
  breakfast: z.number().min(0).default(0),
  lunch: z.number().min(0).default(0),
  dinner: z.number().min(0).default(0),
  note: z.string().optional().nullable(),
});

export type SaveMealRecordInput = z.infer<typeof saveMealRecordSchema>;

export const bulkDailyMealSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  records: z.array(
    z.object({
      userId: z.string(),
      breakfast: z.number().min(0),
      lunch: z.number().min(0),
      dinner: z.number().min(0),
      note: z.string().optional().nullable(),
    })
  ),
});

export type BulkDailyMealInput = z.infer<typeof bulkDailyMealSchema>;
