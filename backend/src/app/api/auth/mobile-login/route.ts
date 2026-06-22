import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyPassword } from "../../../utils/auth";

import { prisma } from "@/app/utils/db";

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, password, deviceId } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json({ error: "Mobile number and password are required" }, { status: 400 });
    }

    const cleanMobile = mobileNumber.replace(/\s+/g, "");

    // Find user
    const user = await prisma.user.findUnique({
      where: { mobileNumber: cleanMobile },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    // Update user's device ID if provided and changed
    if (deviceId && user.deviceId !== deviceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { deviceId },
      });
      user.deviceId = deviceId;
    }

    // Sign JWT
    const jwtToken = jwt.sign(
      { id: user.id, mobileNumber: user.mobileNumber, role: user.role },
      process.env.NEXTAUTH_SECRET || "fallback_secret_please_change",
      { expiresIn: "30d" }
    );

    // Remove password hash from response
    const { password: _, ...userWithoutPassword } = user as any;

    return NextResponse.json({ token: jwtToken, user: userWithoutPassword });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
