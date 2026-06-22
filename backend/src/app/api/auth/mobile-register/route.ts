import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import jwt from "jsonwebtoken";
import { hashPassword, generateReferralCode } from "../../../utils/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, mobileNumber, password, referralCode, deviceId } = await req.json();

    if (!name || !mobileNumber || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanMobile = mobileNumber.replace(/\s+/g, "");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber: cleanMobile },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Mobile number already registered" }, { status: 400 });
    }

    // Handle referral & device restrictions
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase().trim() },
      });

      if (!referrer) {
        return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
      }

      // Referral device ID fraud protection
      const isSelfReferral = deviceId && referrer.deviceId === deviceId;
      const isDuplicateDevice = deviceId ? await prisma.user.findFirst({
        where: { deviceId, referredById: { not: null } },
      }) : null;

      if (isSelfReferral || isDuplicateDevice) {
        console.warn(`Referral device ID fraud detected. User device: ${deviceId}, Referrer device: ${referrer.deviceId}. Bypassing referral commission link.`);
        referrerId = null; // Ignore the referral link to prevent fraud
      } else {
        referrerId = referrer.id;
      }
    }

    // Generate unique referral code for new user
    let newReferralCode = "";
    let codeExists = true;
    while (codeExists) {
      newReferralCode = generateReferralCode();
      const codeCheck = await prisma.user.findUnique({
        where: { referralCode: newReferralCode },
      });
      if (!codeCheck) {
        codeExists = false;
      }
    }

    // Create user and wallet in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          mobileNumber: cleanMobile,
          password: hashPassword(password),
          referralCode: newReferralCode,
          referredById: referrerId,
          deviceId: deviceId || null,
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to KL Dear Lottery!",
          message: "Thank you for registering. Top up your wallet to start playing!",
        },
      });

      // If referred, notify referrer
      if (referrerId) {
        await tx.notification.create({
          data: {
            userId: referrerId,
            title: "New Referral Registered!",
            message: `${name} registered using your referral code. You will earn commission on their recharges!`,
          },
        });
      }

      return user;
    });

    // Sign JWT
    const jwtToken = jwt.sign(
      { id: newUser.id, mobileNumber: newUser.mobileNumber, role: newUser.role },
      process.env.NEXTAUTH_SECRET || "fallback_secret_please_change",
      { expiresIn: "30d" }
    );

    // Remove password hash from response
    const { password: _, ...userWithoutPassword } = newUser as any;

    return NextResponse.json({ token: jwtToken, user: userWithoutPassword });
  } catch (error) {
    console.error("Mobile registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
