import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const { lotteryId, number } = await req.json();

    if (!lotteryId || !number) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lottery = await tx.lottery.findUnique({ where: { id: lotteryId } });
      if (!lottery || lottery.status !== "OPEN") {
        throw new Error("Lottery is not open");
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet || wallet.balance < lottery.ticketPrice) {
        throw new Error("Insufficient balance");
      }

      // Deduct balance
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: lottery.ticketPrice } },
      });

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          lotteryId: lottery.id,
          number,
          amount: lottery.ticketPrice,
        },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: lottery.ticketPrice,
          type: "DEBIT",
          description: `Purchased Ticket for ${lottery.name} (${number})`,
        },
      });

      return ticket;
    });

    return NextResponse.json({ success: true, ticket: result });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
