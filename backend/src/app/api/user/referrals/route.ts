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

    // 1. Fetch user referral code
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Count referred users
    const referredCount = await prisma.user.count({
      where: { referredById: user.id },
    });

    // 3. Fetch referral commission transactions
    const commissions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        description: {
          contains: "Referral Commission",
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalEarned = commissions.reduce((sum, tx) => sum + tx.amount, 0);

    return NextResponse.json({
      referralCode: dbUser.referralCode,
      referredCount,
      totalEarned,
      commissions,
    });
  } catch (error) {
    console.error("Referrals API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
