import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "purchases" or "winnings"

    const whereClause: any = {
      userId: user.id,
    };

    if (type === "winnings") {
      whereClause.status = "WON";
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const total = await prisma.ticket.count({
      where: whereClause,
    });

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        lottery: {
          select: {
            name: true,
            category: true,
            drawTime: true,
            winningNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const hasMore = skip + tickets.length < total;

    return NextResponse.json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
