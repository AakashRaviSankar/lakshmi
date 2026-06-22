"use server";

import { prisma } from "@/app/utils/db";
import { revalidatePath } from "next/cache";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function createHoliday(dateString: string, category: string | null, description: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    if (!dateString || !description) {
      throw new Error("Date and description are required.");
    }

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0); // Normalize holiday to beginning of day

    const normalizedCategory = category === "ALL" ? null : category;

    await prisma.holiday.create({
      data: {
        date,
        category: normalizedCategory,
        description,
      },
    });

    revalidatePath("/admin/holidays");
  } catch (error: any) {
    console.error("Failed to create holiday:", error.message);
    throw error;
  }
}

export async function deleteHoliday(id: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    await prisma.holiday.delete({
      where: { id },
    });

    revalidatePath("/admin/holidays");
  } catch (error: any) {
    console.error("Failed to delete holiday:", error.message);
    throw error;
  }
}
