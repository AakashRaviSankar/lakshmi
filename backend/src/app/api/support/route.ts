import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession, hashPassword, generateReferralCode } from "@/app/utils/auth";

function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// POST — submit support ticket (authenticated)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let userName: string = "Guest";
    let userMobile: string = "";

    // Try to get authenticated user; allow guest submissions too
    if (authHeader) {
      try {
        const user = await verifyUserSession(authHeader);
        userId = user.id;
        userName = user.name || "User";
        userMobile = user.mobileNumber || "";
      } catch {
        // not authenticated — still allow anonymous support
      }
    }

    const body = await req.json();
    const { subject, message, name, mobile } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const ticketId = generateTicketId();

    // Store in notification table for admins (or a dedicated support table if exists)
    // We'll create an admin-visible notification and a user notification
    const submitterName = userId ? userName : (name?.trim() || "Guest");
    const submitterMobile = userId ? userMobile : (mobile?.trim() || "");

    // Create notification record (visible to admins when they check support page)
    await prisma.notification.create({
      data: {
        userId: userId || (await getOrCreateGuestUser(submitterName, submitterMobile)),
        title: `[SUPPORT #${ticketId}] ${subject.trim()}`,
        message: `From: ${submitterName}${submitterMobile ? ` (${submitterMobile})` : ""}\n\n${message.trim()}`,
      },
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: "Support request submitted. Admin will contact you soon.",
    });
  } catch (error: any) {
    console.error("Support ticket error:", error);
    return NextResponse.json({ error: "Failed to submit ticket. Try again." }, { status: 500 });
  }
}

async function getOrCreateGuestUser(name: string, mobile: string): Promise<string> {
  // For anonymous support, we find or create a placeholder user
  const guestEmail = "guest-support@kldear.internal";
  let guest = await prisma.user.findFirst({ where: { email: guestEmail } });
  if (!guest) {
    let code = generateReferralCode();
    // Ensure uniqueness
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (existing) {
      code = `GUEST-${Date.now().toString(36).toUpperCase()}`;
    }
    guest = await prisma.user.create({
      data: {
        name: "Guest Support",
        email: guestEmail,
        mobileNumber: "0000000000",
        password: hashPassword("guest-placeholder"),
        referralCode: code,
        role: "USER",
      },
    });
  }
  return guest.id;
}

// GET — admin can list support tickets (notifications with [SUPPORT] prefix)
export async function GET(req: NextRequest) {
  try {
    const session = await import("next-auth").then((m) =>
      m.getServerSession()
    );

    const authHeader = req.headers.get("authorization");
    let isAdmin = false;

    if (authHeader) {
      try {
        const user = await verifyUserSession(authHeader);
        isAdmin = (user as any).role === "ADMIN";
      } catch {}
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.notification.findMany({
      where: {
        title: { startsWith: "[SUPPORT" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, mobileNumber: true, email: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
