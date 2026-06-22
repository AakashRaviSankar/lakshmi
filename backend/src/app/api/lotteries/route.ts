import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

// Helper to seed daily draws for a given date
async function seedDrawsForDate(date: Date) {
  const years = date.getFullYear();
  const months = date.getMonth();
  const days = date.getDate();

  // Shows definitions
  const shows = [
    { name: "Dear Lottery 1 PM", category: "DEAR", hour: 13, minute: 0 },
    { name: "Dear Lottery 6 PM", category: "DEAR", hour: 18, minute: 0 },
    { name: "Dear Lottery 8 PM", category: "DEAR", hour: 20, minute: 0 },
    { name: "Kerala Lottery 3 PM", category: "KERALA", hour: 15, minute: 0 },
  ];

  for (const show of shows) {
    const drawTime = new Date(years, months, days, show.hour, show.minute, 0, 0);

    // Check if this show already exists for this exact draw time
    const existing = await prisma.lottery.findFirst({
      where: {
        category: show.category,
        drawTime: drawTime,
      },
    });

    if (!existing) {
      await prisma.lottery.create({
        data: {
          name: show.name,
          category: show.category,
          drawTime: drawTime,
          ticketPrice: 10.0, // Default price ₹10
          status: "OPEN",
        },
      });
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    try {
      await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    await seedDrawsForDate(today);
    await seedDrawsForDate(tomorrow);

    const now = new Date();
    const cutoffTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins from now

    // Close any passed draws
    const passedOpenLotteries = await prisma.lottery.findMany({
      where: {
        status: "OPEN",
        drawTime: { lte: now },
      },
    });

    if (passedOpenLotteries.length > 0) {
      await prisma.lottery.updateMany({
        where: {
          id: { in: passedOpenLotteries.map((l) => l.id) },
        },
        data: { status: "CLOSED" },
      });
    }

    // Fetch open lotteries within booking window
    const openLotteries = await prisma.lottery.findMany({
      where: {
        status: "OPEN",
        drawTime: { gt: cutoffTime },
      },
      orderBy: { drawTime: "asc" },
    });

    // Fetch holidays to filter them out
    const holidays = await prisma.holiday.findMany();

    // Filter lotteries that fall on holidays
    const activeLotteries = openLotteries.filter((draw) => {
      const drawDateStr = new Date(draw.drawTime).toISOString().split("T")[0];
      const isDrawOnHoliday = holidays.some((holiday) => {
        const holidayDateStr = new Date(holiday.date).toISOString().split("T")[0];
        if (holidayDateStr === drawDateStr) {
          // If category is null, it's a holiday for the whole app; otherwise specific category
          return holiday.category === null || holiday.category === draw.category;
        }
        return false;
      });
      return !isDrawOnHoliday;
    });

    return NextResponse.json(activeLotteries);
  } catch (error) {
    console.error("Error fetching lotteries:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
