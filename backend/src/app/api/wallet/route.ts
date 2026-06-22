import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserSession(req.headers.get("authorization"));

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query = searchParams.get("query") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {
      userId: user.id,
    };

    if (query) {
      whereClause.description = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (startDate.length === 10) {
          start.setUTCHours(0, 0, 0, 0);
        }
        whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length === 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        whereClause.createdAt.lte = end;
      }
    }

    const total = await prisma.transaction.count({
      where: whereClause,
    });

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const hasMore = skip + transactions.length < total;

    return NextResponse.json({
      wallet,
      transactions: {
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          hasMore,
        },
      },
    });
  } catch (error: any) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
