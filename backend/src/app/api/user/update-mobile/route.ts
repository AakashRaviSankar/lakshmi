import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

import { prisma } from "@/app/utils/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mobileNumber } = await req.json();

    if (!mobileNumber || typeof mobileNumber !== "string") {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    // Check if mobile number is already taken
    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber },
    });

    if (existingUser && existingUser.id !== (session.user as any).id) {
      return NextResponse.json({ error: "Mobile number already in use" }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { mobileNumber },
    });

    return NextResponse.json({ message: "Mobile number updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating mobile number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
