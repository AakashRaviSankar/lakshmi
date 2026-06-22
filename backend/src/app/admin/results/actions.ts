"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/app/utils/db";
import { calculateTicketWinnings } from "@/app/utils/lottery";
import { verifyAdminSessionAction } from "@/app/utils/adminAuth";

export async function declareResult(formData: FormData): Promise<void> {
  try {
    await verifyAdminSessionAction();

    const lotteryId = formData.get("lotteryId") as string;
    const winningNumber = formData.get("winningNumber") as string;

    if (!lotteryId || !winningNumber) {
      throw new Error("Lottery ID and Winning Number are required");
    }

    if (winningNumber.length !== 4 || isNaN(Number(winningNumber))) {
      throw new Error("Winning Number must be a valid 4-digit number (e.g. 5892)");
    }

    const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || lottery.status === "COMPLETED") {
      throw new Error("Invalid lottery or already completed");
    }

    // Run transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark lottery as completed and store winning number
      await tx.lottery.update({
        where: { id: lotteryId },
        data: { status: "COMPLETED", winningNumber },
      });

      // 2. Fetch all tickets for this lottery
      const tickets = await tx.ticket.findMany({
        where: { lotteryId },
      });

      // 3. Process each ticket
      for (const ticket of tickets) {
        const prizeAmount = calculateTicketWinnings(ticket.gameType, ticket.amount, ticket.number, winningNumber);

        if (prizeAmount > 0) {
          // Update ticket status & winnings but do NOT credit wallet yet
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "WON",
              winnings: prizeAmount,
              winningsPaid: false,
            },
          });
        } else {
          // Update ticket status to lost
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "LOST",
              winnings: 0,
              winningsPaid: false,
            },
          });
        }
      }
    });

    revalidatePath("/admin/results");
  } catch (error: any) {
    console.error("Failed to declare result:", error.message);
    throw error;
  }
}

export async function editWinningNumber(lotteryId: string, newWinningNumber: string): Promise<void> {
  try {
    await verifyAdminSessionAction();

    if (!lotteryId || !newWinningNumber) {
      throw new Error("Lottery ID and New Winning Number are required");
    }

    if (newWinningNumber.length !== 4 || isNaN(Number(newWinningNumber))) {
      throw new Error("Winning Number must be a valid 4-digit number (e.g. 5892)");
    }

    const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || lottery.status !== "COMPLETED" || !lottery.winningNumber) {
      throw new Error("Lottery must be completed with an active result to edit.");
    }

    const oldWinningNumber = lottery.winningNumber;
    if (oldWinningNumber === newWinningNumber) {
      return; // No change
    }

    // Run correction inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Fetch all tickets for this lottery
      const tickets = await tx.ticket.findMany({
        where: { lotteryId },
      });

      // 2. Evaluate each ticket for correction
      for (const ticket of tickets) {
        const wasWinner = ticket.status === "WON";
        const wasPaid = ticket.winningsPaid;
        const oldPrize = ticket.winnings;
        const newPrize = calculateTicketWinnings(ticket.gameType, ticket.amount, ticket.number, newWinningNumber);
        const isWinnerNow = newPrize > 0;

        if (wasWinner && isWinnerNow) {
          if (newPrize !== oldPrize) {
            if (wasPaid) {
              const diff = newPrize - oldPrize;
              if (diff > 0) {
                // Credit difference to withdrawable balance
                await tx.wallet.update({
                  where: { userId: ticket.userId },
                  data: { withdrawableBalance: { increment: diff } },
                });
                await tx.transaction.create({
                  data: {
                    userId: ticket.userId,
                    amount: diff,
                    type: "CREDIT",
                    description: `Winnings Adjusted: Result Correction for ${lottery.name} (${ticket.gameType}: ${ticket.number})`,
                  },
                });
                await tx.notification.create({
                  data: {
                    userId: ticket.userId,
                    title: "Winnings Corrected! 🏆",
                    message: `Your winnings for ${lottery.name} were adjusted. Credited difference: ₹${diff.toFixed(2)}.`,
                  },
                });
              } else {
                const absoluteDiff = Math.abs(diff);
                // Deduct difference from withdrawable balance
                await tx.wallet.update({
                  where: { userId: ticket.userId },
                  data: { withdrawableBalance: { decrement: absoluteDiff } },
                });
                await tx.transaction.create({
                  data: {
                    userId: ticket.userId,
                    amount: absoluteDiff,
                    type: "DEBIT",
                    description: `Winnings Revoked (Partial): Result Correction for ${lottery.name} (${ticket.gameType}: ${ticket.number})`,
                  },
                });
                await tx.notification.create({
                  data: {
                    userId: ticket.userId,
                    title: "Winnings Revoked (Correction)",
                    message: `Your winnings for ${lottery.name} were adjusted. Debited difference: ₹${absoluteDiff.toFixed(2)}.`,
                  },
                });
              }
            }
            // Update ticket winnings
            await tx.ticket.update({
              where: { id: ticket.id },
              data: { winnings: newPrize },
            });
          }
        } else if (wasWinner && !isWinnerNow) {
          if (wasPaid) {
            // Revert entire payout from withdrawable balance
            await tx.wallet.update({
              where: { userId: ticket.userId },
              data: { withdrawableBalance: { decrement: oldPrize } },
            });
            await tx.transaction.create({
              data: {
                userId: ticket.userId,
                amount: oldPrize,
                type: "DEBIT",
                description: `Winnings Revoked: Result Correction for ${lottery.name} (${ticket.gameType}: ${ticket.number})`,
              },
            });
            await tx.notification.create({
              data: {
                userId: ticket.userId,
                title: "Winnings Revoked (Correction)",
                message: `Your winnings of ₹${oldPrize.toFixed(2)} for ${lottery.name} were revoked due to a result correction.`,
              },
            });
          }
          // Mark LOST
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "LOST",
              winnings: 0,
              winningsPaid: false,
            },
          });
        } else if (!wasWinner && isWinnerNow) {
          // Mark WON but unpaid (can be paid via payouts page)
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "WON",
              winnings: newPrize,
              winningsPaid: false,
            },
          });
        }
      }

      // 3. Update winning number in lottery record
      await tx.lottery.update({
        where: { id: lotteryId },
        data: { winningNumber: newWinningNumber },
      });
    });

    revalidatePath("/admin/results");
  } catch (error: any) {
    console.error("Failed to edit winning number:", error.message);
    throw error;
  }
}


