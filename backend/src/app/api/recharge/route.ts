import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

const rechargeSchema = z.object({
  amount: z.number().min(100, "Minimum recharge amount is ₹100"),
  utrNumber: z.string().min(6),
  screenshotUrl: z.string().url().optional().nullable(),
  scanner: z.string().optional(),
});

// GET recharge history
export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

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
      whereClause.OR = [
        { utrNumber: { contains: query, mode: "insensitive" } },
        { scanner: { contains: query, mode: "insensitive" } },
      ];
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

    const total = await prisma.rechargeRequest.count({
      where: whereClause,
    });

    const recharges = await prisma.rechargeRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const hasMore = skip + recharges.length < total;

    return NextResponse.json({
      data: recharges,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Fetch recharges error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST submit recharge
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = rechargeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request data", issues: parseResult.error.issues }, { status: 400 });
    }

    const { amount, utrNumber, screenshotUrl, scanner } = parseResult.data;

    const existingRequest = await prisma.rechargeRequest.findUnique({
      where: { utrNumber },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "UTR Number already submitted" }, { status: 409 });
    }

    const recharge = await prisma.rechargeRequest.create({
      data: {
        userId: user.id,
        amount,
        utrNumber,
        screenshotUrl,
        scanner: scanner || "Scanner 1",
      },
    });

    return NextResponse.json({ success: true, recharge });
  } catch (error) {
    console.error("Recharge request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
