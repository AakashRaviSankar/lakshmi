"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/utils/db";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function createLottery(formData: FormData): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const drawTime = formData.get("drawTime") as string;
    const ticketPrice = parseFloat(formData.get("ticketPrice") as string);

    if (!name || !category || !drawTime || isNaN(ticketPrice)) {
      throw new Error("Missing required fields");
    }

    await prisma.lottery.create({
      data: {
        name,
        category,
        drawTime: new Date(drawTime),
        ticketPrice,
        status: "OPEN",
      },
    });

    revalidatePath("/admin/lotteries");
  } catch (error: any) {
    console.error("Failed to create lottery:", error.message);
    throw error;
  }
}

export async function closeLottery(lotteryId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();
    await prisma.lottery.update({
      where: { id: lotteryId },
      data: { status: "CLOSED" },
    });

    revalidatePath("/admin/lotteries");
  } catch (error: any) {
    console.error("Failed to close lottery:", error.message);
    throw error;
  }
}
