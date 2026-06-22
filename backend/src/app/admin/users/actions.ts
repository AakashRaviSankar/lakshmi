"use server";

import { prisma } from "@/app/utils/db";
import { revalidatePath } from "next/cache";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";
import { getCanonicalUserId } from "@/app/utils/auth";

const ADMIN_PIN = process.env.ADMIN_PIN || "9999";

export async function toggleBlockUser(userId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    });

    revalidatePath("/admin/users");
  } catch (error: any) {
    console.error("Failed to toggle block status:", error.message);
    throw error;
  }
}

export async function editUser(userId: string, name: string, email: string, mobileNumber: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const cleanMobile = mobileNumber.replace(/\s+/g, "");

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: email || null,
        mobileNumber: cleanMobile || null,
      },
    });

    revalidatePath("/admin/users");
  } catch (error: any) {
    console.error("Failed to edit user:", error.message);
    throw error;
  }
}

export async function updateUserWallet(
  userId: string,
  amount: number,
  actionType: "increment" | "decrement",
  adminPin: string,
  walletType: "balance" | "withdrawableBalance" = "balance"
): Promise<void> {
  try {
    await verifyAdminSessionAction();

    if (adminPin !== ADMIN_PIN) {
      throw new Error("Invalid admin security PIN.");
    }
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number.");
    }

    const canonicalUserId = await getCanonicalUserId(userId);

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: canonicalUserId },
        update: {},
        create: { userId: canonicalUserId, balance: 0, withdrawableBalance: 0 },
      });

      const currentBalance = wallet[walletType];
      if (actionType === "decrement" && currentBalance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ₹${currentBalance}`);
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { userId: canonicalUserId },
        data: {
          [walletType]: actionType === "increment" ? { increment: amount } : { decrement: amount },
        },
      });

      // Record transaction log
      const type = actionType === "increment" ? "CREDIT" : "DEBIT";
      const targetLabel = walletType === "balance" ? "Play Balance" : "Withdrawable Winnings";
      const desc = `Admin Wallet Adjustment (${actionType === "increment" ? "Credit" : "Debit"} to ${targetLabel})`;

      await tx.transaction.create({
        data: {
          userId: canonicalUserId,
          amount,
          type,
          description: desc,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: canonicalUserId,
          title: "Wallet Balance Adjusted",
          message: `The admin adjusted your ${targetLabel}. ${actionType === "increment" ? "Credited" : "Debited"}: ₹${amount.toFixed(2)}.`,
        },
      });
    });

    revalidatePath("/admin/users");
  } catch (error: any) {
    console.error("Failed to update wallet:", error.message);
    throw error; // Throw error to bubble up to the client form
  }
}
