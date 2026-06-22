"use server";

import { prisma } from "@/app/utils/db";
import { revalidatePath } from "next/cache";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function payUserWinningsForShow(userId: string, lotteryId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    if (!userId || !lotteryId) {
      throw new Error("User ID and Lottery ID are required");
    }

    const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery) throw new Error("Lottery show not found");

    await prisma.$transaction(async (tx) => {
      // 1. Find all unpaid winning tickets for this user in this lottery
      const unpaidTickets = await tx.ticket.findMany({
        where: {
          userId,
          lotteryId,
          status: "WON",
          winningsPaid: false,
        },
      });

      if (unpaidTickets.length === 0) {
        throw new Error("No unpaid winnings found for this user in this draw.");
      }

      // 2. Sum the winnings
      const totalWinnings = unpaidTickets.reduce((sum, ticket) => sum + ticket.winnings, 0);

      if (totalWinnings <= 0) {
        throw new Error("Total winnings must be greater than zero.");
      }

      // 3. Increment user's wallet withdrawable balance
      await tx.wallet.upsert({
        where: { userId },
        update: { withdrawableBalance: { increment: totalWinnings } },
        create: { userId, withdrawableBalance: totalWinnings, balance: 0 },
      });

      // 4. Mark tickets as paid
      await tx.ticket.updateMany({
        where: {
          userId,
          lotteryId,
          status: "WON",
          winningsPaid: false,
        },
        data: {
          winningsPaid: true,
        },
      });

      // 5. Create transaction log
      await tx.transaction.create({
        data: {
          userId,
          amount: totalWinnings,
          type: "CREDIT",
          description: `Payout: Lottery Winnings for ${lottery.name}`,
        },
      });

      // 6. Send notification
      await tx.notification.create({
        data: {
          userId,
          title: "Winnings Paid! 💰🏆",
          message: `Your winnings of ₹${totalWinnings.toFixed(2)} for ${lottery.name} have been credited to your Withdrawable Balance. You can now request a withdrawal!`,
        },
      });
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/admin/reports");
  } catch (error: any) {
    console.error("Payout error:", error.message);
    throw error;
  }
}

export async function payAllWinningsForShow(lotteryId: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    if (!lotteryId) {
      throw new Error("Lottery ID is required");
    }

    const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery) throw new Error("Lottery show not found");

    // Fetch all unpaid winning tickets for this show
    const unpaidTickets = await prisma.ticket.findMany({
      where: {
        lotteryId,
        status: "WON",
        winningsPaid: false,
      },
    });

    if (unpaidTickets.length === 0) {
      throw new Error("No unpaid winnings found for this draw.");
    }

    // Group tickets by userId
    const userWinningsMap: Record<string, { tickets: string[]; total: number }> = {};
    for (const ticket of unpaidTickets) {
      if (!userWinningsMap[ticket.userId]) {
        userWinningsMap[ticket.userId] = { tickets: [], total: 0 };
      }
      userWinningsMap[ticket.userId].tickets.push(ticket.id);
      userWinningsMap[ticket.userId].total += ticket.winnings;
    }

    // Pay each user in a single transaction sequence
    await prisma.$transaction(async (tx) => {
      for (const [userId, data] of Object.entries(userWinningsMap)) {
        // Increment withdrawableBalance
        await tx.wallet.upsert({
          where: { userId },
          update: { withdrawableBalance: { increment: data.total } },
          create: { userId, withdrawableBalance: data.total, balance: 0 },
        });

        // Mark tickets as paid
        await tx.ticket.updateMany({
          where: {
            id: { in: data.tickets },
          },
          data: {
            winningsPaid: true,
          },
        });

        // Record CREDIT transaction
        await tx.transaction.create({
          data: {
            userId,
            amount: data.total,
            type: "CREDIT",
            description: `Payout: Lottery Winnings for ${lottery.name}`,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId,
            title: "Winnings Paid! 💰🏆",
            message: `Your winnings of ₹${data.total.toFixed(2)} for ${lottery.name} have been credited to your Withdrawable Balance. You can now request a withdrawal!`,
          },
        });
      }
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/admin/reports");
  } catch (error: any) {
    console.error("Pay all error:", error.message);
    throw error;
  }
}
