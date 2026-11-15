import { z } from "zod";

export const profileUserIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Invalid member ID.");
export const profileMonthSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, "Invalid month.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// Fields a member may change on their own profile. Role, rent, status and NID stay with managers.
export const updateOwnProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: optionalText(20),
  emergencyContact: optionalText(80),
  address: optionalText(200),
  occupation: optionalText(80),
});

export type UpdateOwnProfileInput = z.input<typeof updateOwnProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
