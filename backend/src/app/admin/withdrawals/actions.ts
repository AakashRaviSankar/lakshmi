"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/utils/db";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function approveWithdrawal(withdrawId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const request = await prisma.withdrawRequest.findUnique({
      where: { id: withdrawId },
    });

    if (!request || request.status !== "PENDING") {
      throw new Error("Invalid or already processed withdrawal request.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark status as APPROVED
      await tx.withdrawRequest.update({
        where: { id: withdrawId },
        data: { status: "APPROVED" },
      });

      // 2. Notify user
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: "Withdrawal Approved! 💸✅",
          message: `Your withdrawal request of ₹${request.amount.toFixed(2)} has been approved and processed to your bank details.`,
        },
      });
    });

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  } catch (error: any) {
    console.error("Failed to approve withdrawal:", error.message);
    throw error;
  }
}

export async function rejectWithdrawal(withdrawId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const request = await prisma.withdrawRequest.findUnique({
      where: { id: withdrawId },
    });

    if (!request || request.status !== "PENDING") {
      throw new Error("Invalid or already processed withdrawal request.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark status as REJECTED
      await tx.withdrawRequest.update({
        where: { id: withdrawId },
        data: { status: "REJECTED" },
      });

      // 2. Refund withdrawal amount to user's withdrawableBalance
      await tx.wallet.upsert({
        where: { userId: request.userId },
        update: { withdrawableBalance: { increment: request.amount } },
        create: { userId: request.userId, withdrawableBalance: request.amount, balance: 0 },
      });

      // 3. Record transaction log (CREDIT)
      await tx.transaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          type: "CREDIT",
          description: `Withdrawal Rejected (Refund: A/C: ${request.accountNumber.slice(-4)})`,
        },
      });

      // 4. Notify user of the rejection & refund
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: "Withdrawal Rejected (Refunded) ❌🔄",
          message: `Your withdrawal request of ₹${request.amount.toFixed(2)} was rejected. The funds have been refunded to your Withdrawable Winnings balance.`,
        },
      });
    });

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  } catch (error: any) {
    console.error("Failed to reject withdrawal:", error.message);
    throw error;
  }
}

export async function deleteWithdrawal(withdrawId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    await prisma.withdrawRequest.delete({
      where: { id: withdrawId },
    });

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  } catch (error: any) {
    console.error("Failed to delete withdrawal request record:", error.message);
    throw error;
  }
}
