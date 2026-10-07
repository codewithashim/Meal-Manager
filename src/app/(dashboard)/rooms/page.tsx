import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRooms, getUnassignedUsers } from "@/server/actions/roomActions";
import RoomClientPage from "@/features/rooms/components/RoomClientPage";

export const metadata = {
  title: "Rooms & Seat Allocation | Mess Mate",
  description: "Manage mess rooms, floor layouts, seat capacities, and member seat assignments.",
};

export default async function RoomsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const rooms = await getRooms();
  const unassignedUsers = await getUnassignedUsers();

  return (
    <RoomClientPage
      initialRooms={rooms as any}
      initialUnassignedUsers={unassignedUsers as any}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
