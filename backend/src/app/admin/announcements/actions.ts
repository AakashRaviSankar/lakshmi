"use server";

import { prisma } from "@/app/utils/db";
import { revalidatePath } from "next/cache";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function createAnnouncement(formData: FormData): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;

    if (!title || !message) {
      throw new Error("Title and message are required.");
    }

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length === 0) return;

    // Create notifications for all users in a batch
    await prisma.notification.createMany({
      data: users.map((u: { id: string }) => ({
        userId: u.id,
        title,
        message,
        read: false,
      })),
    });

    revalidatePath("/admin/announcements");
  } catch (error: any) {
    console.error("Failed to create announcement:", error.message);
    throw error;
  }
}
