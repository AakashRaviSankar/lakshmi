import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

// Get withdrawal history
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserSession(req.headers.get("authorization"));

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
        { accountNumber: { contains: query, mode: "insensitive" } },
        { accountHolder: { contains: query, mode: "insensitive" } },
        { upiId: { contains: query, mode: "insensitive" } },
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

    const total = await prisma.withdrawRequest.count({
      where: whereClause,
    });

    const withdrawals = await prisma.withdrawRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const hasMore = skip + withdrawals.length < total;

    return NextResponse.json({
      data: withdrawals,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error: any) {
    console.error("Fetch withdrawals error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 401 });
  }
}

// Request withdrawal
export async function POST(req: NextRequest) {
  let user: any;
  try {
    user = await verifyUserSession(req.headers.get("authorization"));
  } catch (authError: any) {
    return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, accountNumber, ifscCode, accountHolder, upiId } = await req.json();

    if (!amount || !accountNumber || !ifscCode || !accountHolder) {
      return NextResponse.json({ error: "Missing required banking fields" }, { status: 400 });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount must be greater than zero" }, { status: 400 });
    }
    if (withdrawAmount < 100) {
      return NextResponse.json({ error: "Minimum withdrawal amount is ₹100" }, { status: 400 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet || wallet.withdrawableBalance < withdrawAmount) {
        throw new Error("Insufficient withdrawable balance for withdrawal");
      }

      // Deduct withdrawableBalance immediately
      await tx.wallet.update({
        where: { userId: user.id },
        data: { withdrawableBalance: { decrement: withdrawAmount } },
      });

      // Save/update bank details on the User model
      await tx.user.update({
        where: { id: user.id },
        data: {
          bankAccountNumber: accountNumber,
          bankIfscCode: ifscCode,
          bankAccountHolder: accountHolder,
          upiId: upiId || null,
        },
      });

      // Create withdrawal request
      const request = await tx.withdrawRequest.create({
        data: {
          userId: user.id,
          amount: withdrawAmount,
          accountNumber,
          ifscCode,
          accountHolder,
          upiId: upiId || null,
          status: "PENDING",
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: withdrawAmount,
          type: "DEBIT",
          description: `Withdrawal Request Submitted (A/C: ${accountNumber.slice(-4)}${upiId ? `, UPI: ${upiId}` : ""})`,
        },
      });

      // Send notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Withdrawal Submitted",
          message: `Your withdrawal request of ₹${withdrawAmount.toFixed(2)} has been submitted and is pending admin approval.`,
        },
      });

      return request;
    });

    return NextResponse.json({ success: true, withdrawal: result });
  } catch (error: any) {
    console.error("Create withdrawal error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
