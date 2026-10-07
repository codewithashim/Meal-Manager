import { z } from "zod";

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .transform((data) => ({
    identifier: (data.identifier || data.email || "").trim(),
    password: data.password,
  }))
  .refine((data) => data.identifier.length > 0, {
    message: "Please enter your email or phone number",
    path: ["identifier"],
  });

export type LoginInput = {
  identifier?: string;
  email?: string;
  password: string;
};

export const registerMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "USER"]).default("USER"),
  monthlyRent: z.number().min(0).default(0),
  nidNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
