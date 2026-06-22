import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

export async function GET(req: NextRequest) {
  try {
    try {
      await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // optional filter: DEAR / KERALA
    const query = searchParams.get("query") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {
      status: "COMPLETED",
    };

    if (category) {
      whereClause.category = category;
    }

    if (query) {
      whereClause.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      whereClause.drawTime = {};
      if (startDate) {
        const start = new Date(startDate);
        if (startDate.length === 10) {
          start.setUTCHours(0, 0, 0, 0);
        }
        whereClause.drawTime.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length === 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        whereClause.drawTime.lte = end;
      }
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const total = await prisma.lottery.count({
      where: whereClause,
    });

    const completed = await prisma.lottery.findMany({
      where: whereClause,
      orderBy: { drawTime: "desc" },
      skip,
      take: limit,
    });

    const hasMore = skip + completed.length < total;

    return NextResponse.json({
      data: completed,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
