import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

// Fetch stored payment details
export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bankAccountNumber: true,
        bankIfscCode: true,
        bankAccountHolder: true,
        upiId: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      bankAccountNumber: dbUser.bankAccountNumber || "",
      bankIfscCode: dbUser.bankIfscCode || "",
      bankAccountHolder: dbUser.bankAccountHolder || "",
      upiId: dbUser.upiId || "",
    });
  } catch (error) {
    console.error("Fetch payment details error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Save/update payment details
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const { bankAccountNumber, bankIfscCode, bankAccountHolder, upiId } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
        bankIfscCode: bankIfscCode !== undefined ? bankIfscCode : undefined,
        bankAccountHolder: bankAccountHolder !== undefined ? bankAccountHolder : undefined,
        upiId: upiId !== undefined ? upiId : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      paymentDetails: {
        bankAccountNumber: updatedUser.bankAccountNumber || "",
        bankIfscCode: updatedUser.bankIfscCode || "",
        bankAccountHolder: updatedUser.bankAccountHolder || "",
        upiId: updatedUser.upiId || "",
      },
    });
  } catch (error: any) {
    console.error("Save payment details error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
