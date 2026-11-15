"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ProfileService } from "@/features/profile/services/profile.service";
import type { ChangePasswordInput, UpdateOwnProfileInput } from "@/lib/validations/profile";

export async function getProfileOverview(userId: string, monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await ProfileService.getOverview(
    { id: session.user.id, role: session.user.role, permissions: session.user.permissions },
    userId,
    monthStr
  );
}

export async function updateOwnProfile(data: UpdateOwnProfileInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await ProfileService.updateOwnProfile(session.user.id, data);
    if (result.success) {
      revalidatePath("/profile");
      revalidatePath("/users");
      // The shell shows the member's name, so refresh every dashboard page.
      revalidatePath("/", "layout");
    }
    return result;
  } catch (err: unknown) {
    console.error("Failed to update profile:", err);
    return { error: "Could not update your profile. Please try again." };
  }
}

export async function changeOwnPassword(data: ChangePasswordInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    return await ProfileService.changePassword(session.user.id, data);
  } catch (err: unknown) {
    console.error("Failed to change password:", err);
    return { error: "Could not change your password. Please try again." };
  }
}
