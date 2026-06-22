import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";
import { verifyUserSession } from "@/app/utils/auth";

// GET notifications
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

    const total = await prisma.notification.count({
      where: { userId: user.id },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const hasMore = skip + notifications.length < total;

    return NextResponse.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST mark as read
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUserSession(req.headers.get("authorization"));
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: user.id,
        },
        data: { read: true },
      });
    } else {
      // Mark all user notifications as read
      await prisma.notification.updateMany({
        where: { userId: user.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications mark read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
