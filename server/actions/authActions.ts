"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { AuthError } from "next-auth";

export async function loginAction(data: LoginInput) {
  try {
    const validated = loginSchema.parse(data);

    // Auto-seed default Admin if database has zero users
    const userCount = await db.user.count();
    if (userCount === 0) {
      const defaultPassword = await bcrypt.hash("admin123", 12);
      await db.user.create({
        data: {
          name: "System Administrator",
          email: "admin@messmate.com",
          passwordHash: defaultPassword,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log("Seeded default Admin account: admin@messmate.com / admin123");
    }

    await signIn("credentials", {
      identifier: validated.identifier,
      password: validated.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email/phone number or password." };
        default:
          return { error: "An unexpected error occurred during authentication." };
      }
    }
    return { error: error instanceof Error ? error.message : "Failed to sign in." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
