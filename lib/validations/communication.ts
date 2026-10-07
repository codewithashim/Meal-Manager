import { z } from "zod";

export const complaintCategories = [
  "MAINTENANCE",
  "ELECTRICITY",
  "WATER",
  "INTERNET",
  "CLEANING",
  "FOOD",
  "ROOM",
  "OTHER",
] as const;

export const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const complaintStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;

export const createComplaintSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum(complaintCategories),
  description: z.string().min(5, "Please provide a detailed description"),
  priority: z.enum(priorities).default("MEDIUM"),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const updateComplaintStatusSchema = z.object({
  id: z.string(),
  status: z.enum(complaintStatuses),
  adminNote: z.string().optional().nullable(),
});

export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;

export const createNoticeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.enum(priorities).default("MEDIUM"),
  expiryDate: z.string().optional().nullable(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
