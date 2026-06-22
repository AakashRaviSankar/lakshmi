"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/app/utils/db";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function approveRecharge(rechargeId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const recharge = await prisma.rechargeRequest.findUnique({
      where: { id: rechargeId },
    });

    if (!recharge || recharge.status !== "PENDING") {
      throw new Error("Invalid recharge request");
    }

    // Run transaction to update status and add to wallet
    await prisma.$transaction(async (tx) => {
      // 1. Mark approved
      await tx.rechargeRequest.update({
        where: { id: rechargeId },
        data: { status: "APPROVED" },
      });

      // 2. Fetch recharged user to check for referrer
      const user = await tx.user.findUnique({
        where: { id: recharge.userId },
      });

      // 3. Upsert wallet and add balance to recharged user
      await tx.wallet.upsert({
        where: { userId: recharge.userId },
        update: { balance: { increment: recharge.amount } },
        create: { userId: recharge.userId, balance: recharge.amount },
      });

      // 4. Record transaction for recharged user
      await tx.transaction.create({
        data: {
          userId: recharge.userId,
          amount: recharge.amount,
          type: "CREDIT",
          description: `Recharge Approved (UTR: ${recharge.utrNumber})`,
        },
      });

      // 5. Notify recharged user
      await tx.notification.create({
        data: {
          userId: recharge.userId,
          title: "Recharge Approved",
          message: `Your recharge request of ₹${recharge.amount.toFixed(2)} was approved! Balance updated.`,
        },
      });

      // 6. Handle referral commission (1% of the recharge amount)
      if (user && user.referredById) {
        const commission = recharge.amount * 0.01;
        if (commission > 0) {
          // Upsert referrer's wallet
          await tx.wallet.upsert({
            where: { userId: user.referredById },
            update: { balance: { increment: commission } },
            create: { userId: user.referredById, balance: commission },
          });

          // Record transaction for referrer
          await tx.transaction.create({
            data: {
              userId: user.referredById,
              amount: commission,
              type: "CREDIT",
              description: `Referral Commission (Friend: ${user.name || user.mobileNumber})`,
            },
          });

          // Notify referrer
          await tx.notification.create({
            data: {
              userId: user.referredById,
              title: "Referral Commission Credited!",
              message: `You earned ₹${commission.toFixed(2)} (1% commission) from your referred friend ${user.name || user.mobileNumber}'s recharge.`,
            },
          });
        }
      }
    });

    revalidatePath("/admin/recharges");
  } catch (error: any) {
    console.error("Failed to approve recharge:", error.message);
    throw error;
  }
}

export async function rejectRecharge(rechargeId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const recharge = await prisma.rechargeRequest.update({
      where: { id: rechargeId },
      data: { status: "REJECTED" },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: recharge.userId,
        title: "Recharge Rejected",
        message: `Your recharge request of ₹${recharge.amount.toFixed(2)} was rejected. Please verify the UTR and try again.`,
      },
    });

    revalidatePath("/admin/recharges");
  } catch (error: any) {
    console.error("Failed to reject recharge:", error.message);
    throw error;
  }
}

export async function deleteRecharge(rechargeId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    await prisma.rechargeRequest.delete({
      where: { id: rechargeId },
    });

    revalidatePath("/admin/recharges");
  } catch (error: any) {
    console.error("Failed to delete recharge:", error.message);
    throw error;
  }
}

export async function revokeRechargeApproval(rechargeId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const recharge = await prisma.rechargeRequest.findUnique({
      where: { id: rechargeId },
    });

    if (!recharge || recharge.status !== "APPROVED") {
      throw new Error("Only approved recharge requests can be revoked.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revert request status
      await tx.rechargeRequest.update({
        where: { id: rechargeId },
        data: { status: "REJECTED" },
      });

      // 2. Fetch recharged user
      const user = await tx.user.findUnique({
        where: { id: recharge.userId },
      });

      // 3. Deduct balance from recharged user's wallet
      await tx.wallet.update({
        where: { userId: recharge.userId },
        data: { balance: { decrement: recharge.amount } },
      });

      // 4. Record DEBIT transaction
      await tx.transaction.create({
        data: {
          userId: recharge.userId,
          amount: recharge.amount,
          type: "DEBIT",
          description: `Recharge Approval Revoked (UTR: ${recharge.utrNumber})`,
        },
      });

      // 5. Notify recharged user
      await tx.notification.create({
        data: {
          userId: recharge.userId,
          title: "Recharge Approved Revoked",
          message: `The admin has revoked approval for UTR: ${recharge.utrNumber}. ₹${recharge.amount.toFixed(2)} was debited from your wallet.`,
        },
      });

      // 6. Revert referral commission if applicable
      if (user && user.referredById) {
        const commission = recharge.amount * 0.01;
        if (commission > 0) {
          // Deduct from referrer's wallet
          await tx.wallet.update({
            where: { userId: user.referredById },
            data: { balance: { decrement: commission } },
          });

          // Record DEBIT transaction for referrer
          await tx.transaction.create({
            data: {
              userId: user.referredById,
              amount: commission,
              type: "DEBIT",
              description: `Referral Commission Revoked (Friend: ${user.name || user.mobileNumber})`,
            },
          });

          // Notify referrer
          await tx.notification.create({
            data: {
              userId: user.referredById,
              title: "Referral Commission Revoked",
              message: `₹${commission.toFixed(2)} referral commission has been revoked because your referred friend ${user.name || user.mobileNumber}'s recharge approval was revoked.`,
            },
          });
        }
      }
    });

    revalidatePath("/admin/recharges");
  } catch (error: any) {
    console.error("Failed to revoke recharge approval:", error.message);
    throw error;
  }
}

