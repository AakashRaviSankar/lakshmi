import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Helper to authenticate and authorize admin users in Server Actions.
 * Throws an error if the user is not authenticated or is not an ADMIN.
 */
export async function verifyAdminSessionAction(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin role required.");
  }
}
