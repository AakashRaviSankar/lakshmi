import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

const DAYS_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper to calculate weekly qualification status
async function getSundayBonusEligibility(userId: string) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const startOfWeek = new Date(today);

  // If today is Sunday, we check the Mon-Sat of the week that just ended
  if (dayOfWeek === 0) {
    startOfWeek.setDate(today.getDate() - 6);
  } else {
    // If today is Mon-Sat, we check the current week
    startOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // Set start of Monday to 00:00:00.000 local time
  startOfWeek.setHours(0, 0, 0, 0);

  const daysStatus = [];
  let totalDaysQualified = 0;

  for (let i = 0; i < 6; i++) {
    const dayStart = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Fetch tickets purchased on this day
    const tickets = await prisma.ticket.findMany({
      where: {
        userId,
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    const amountSpent = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);

    // Count unique shows/lotteries
    const uniqueShows = new Set(tickets.map((t) => t.lotteryId));
    const showsCount = uniqueShows.size;

    const qualified = amountSpent >= 100 && showsCount >= 2;
    if (qualified) {
      totalDaysQualified++;
    }

    daysStatus.push({
      day: DAYS_NAMES[i],
      date: dayStart.toISOString().split("T")[0],
      amountSpent,
      showsCount,
      qualified,
    });
  }

  // Check if claimed
  const claim = await prisma.sundayBonusClaim.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart: startOfWeek,
      },
    },
  });

  return {
    weekStart: startOfWeek.toISOString().split("T")[0],
    daysStatus,
    eligible: totalDaysQualified === 6,
    claimed: !!claim,
    totalDaysQualified,
  };
}

// GET eligibility and progress
export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const status = await getSundayBonusEligibility(user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Sunday status fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST claim bonus
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    // 1. Enforce that claims can only be processed on Sunday
    const today = new Date();
    if (today.getDay() !== 0) {
      return NextResponse.json({ error: "Sunday bonus can only be claimed on Sundays." }, { status: 400 });
    }

    const status = await getSundayBonusEligibility(user.id);

    if (!status.eligible) {
      return NextResponse.json(
        { error: "You did not purchase tickets for >= ₹100 across >= 2 shows daily from Monday to Saturday." },
        { status: 400 }
      );
    }

    if (status.claimed) {
      return NextResponse.json({ error: "You have already claimed your Sunday bonus for this week." }, { status: 400 });
    }

    const weekStartDate = new Date(status.weekStart);

    // Credit bonus inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create claim record
      await tx.sundayBonusClaim.create({
        data: {
          userId: user.id,
          weekStart: weekStartDate,
          amount: 100.0,
        },
      });

      // 2. Increment wallet balance
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: 100.0 } },
      });

      // 3. Record transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: 100.0,
          type: "CREDIT",
          description: "Sunday Promotional Bonus Credit",
        },
      });

      // 4. Send notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Sunday Bonus Credited!",
          message: "Congratulations! Your ₹100 Sunday Promotional Bonus has been credited to your wallet.",
        },
      });
    });

    return NextResponse.json({ success: true, message: "₹100 Sunday Bonus claimed successfully!" });
  } catch (error: any) {
    console.error("Sunday bonus claim error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
