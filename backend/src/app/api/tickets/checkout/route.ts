import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

interface CartItem {
  lotteryId: string;
  number: string;
  amount: number;
  gameType: string;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let user;
    try {
      user = await verifyUserSession(authHeader);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const { tickets } = await req.json() as { tickets: CartItem[] };

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Process checkout inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate total price and validate input format
      let totalCost = 0;
      for (const item of tickets) {
        if (!item.lotteryId || !item.number || !item.amount || !item.gameType) {
          throw new Error("Invalid ticket details in cart");
        }
        if (item.amount <= 0) {
          throw new Error("Ticket amount must be positive");
        }
        const qty = item.quantity || 1;
        if (qty <= 0) {
          throw new Error("Ticket quantity must be at least 1");
        }
        totalCost += item.amount * qty;
      }

      // 2. Check wallet balance
      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet || wallet.balance < totalCost) {
        throw new Error(`Insufficient wallet balance. Total required: ₹${totalCost.toFixed(2)}, available: ₹${wallet?.balance.toFixed(2) || 0}`);
      }

      // 3. Verify each ticket draw cutoff
      const now = new Date();
      // Enforce 5 minute cutoff: show time must be > now + 5 mins
      const cutoffMs = 5 * 60 * 1000;

      // Fetch holidays
      const holidays = await tx.holiday.findMany();

      const createdTickets = [];
      for (const item of tickets) {
        const lottery = await tx.lottery.findUnique({ where: { id: item.lotteryId } });
        if (!lottery) {
          throw new Error("Lottery draw not found");
        }
        if (lottery.status !== "OPEN") {
          throw new Error(`Draw "${lottery.name}" is no longer open for booking`);
        }

        const showTime = new Date(lottery.drawTime);
        if (showTime.getTime() - now.getTime() < cutoffMs) {
          throw new Error(`Booking is closed for "${lottery.name}" (draw is within 5 minutes)`);
        }

        // Verify holiday block
        const drawDateStr = showTime.toISOString().split("T")[0];
        const isOnHoliday = holidays.some((h) => {
          const holidayDateStr = new Date(h.date).toISOString().split("T")[0];
          if (holidayDateStr === drawDateStr) {
            return h.category === null || h.category === lottery.category;
          }
          return false;
        });

        if (isOnHoliday) {
          throw new Error(`Draw "${lottery.name}" falls on a scheduled holiday and cannot be booked`);
        }

        // Validate number matches the gameType pattern
        const gameType = item.gameType;
        const num = item.number;
        const amt = item.amount;

        // Validate ticket price according to game rules
        if (gameType.startsWith("SINGLE") && amt !== 11) {
          throw new Error("Single Digit ticket price is fixed at ₹11");
        }
        if (gameType.startsWith("DOUBLE") && amt !== 11) {
          throw new Error("Double Digit ticket price is fixed at ₹11");
        }
        if (gameType === "THREE_DIGIT" && ![12, 28, 30, 55, 60].includes(amt)) {
          throw new Error("Three Digit ticket price must be ₹12, ₹28, ₹30, ₹55, or ₹60");
        }
        if (gameType === "FOUR_DIGIT" && amt !== 50) {
          throw new Error("Four Digit ticket price is fixed at ₹50");
        }

        if (gameType.startsWith("SINGLE") && num.length !== 1) {
          throw new Error(`Single Digit game requires exactly 1 digit`);
        }
        if (gameType.startsWith("DOUBLE") && num.length !== 2) {
          throw new Error(`Double Digit game requires exactly 2 digits`);
        }
        if (gameType === "THREE_DIGIT" && num.length !== 3) {
          throw new Error(`Three Digit game requires exactly 3 digits`);
        }
        if (gameType === "FOUR_DIGIT" && num.length !== 4) {
          throw new Error(`Four Digit game requires exactly 4 digits`);
        }

        // Create ticket (loop through quantity)
        const qty = item.quantity || 1;
        for (let q = 0; q < qty; q++) {
          const ticket = await tx.ticket.create({
            data: {
              userId: user.id,
              lotteryId: item.lotteryId,
              number: num,
              amount: item.amount,
              gameType: gameType,
              status: "PENDING",
            },
          });
          createdTickets.push(ticket);
        }
      }

      // 4. Deduct wallet balance
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: totalCost } },
      });

      // 5. Create transaction log
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: totalCost,
          type: "DEBIT",
          description: `Purchased ${tickets.length} tickets (Cart Checkout)`,
        },
      });

      return createdTickets;
    });

    return NextResponse.json({ success: true, tickets: result });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
