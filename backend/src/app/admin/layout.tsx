import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminNavigation from "./AdminNavigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/"); // Redirect to admin login page
  }

  return (
    <AdminNavigation session={session}>
      {children}
    </AdminNavigation>
  );
}
