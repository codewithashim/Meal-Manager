import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/server/actions/userActions";
import UserClientPage from "@/features/users/components/UserClientPage";

export const metadata = {
  title: "Member Management | Meal Manager",
  description: "Manage members, roles, status, and room rents.",
};

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const users = await getUsers();

  return (
    <UserClientPage
      initialUsers={users as any}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
