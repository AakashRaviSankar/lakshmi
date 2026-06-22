import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: "default",
          supportMobile: "9962188600",
          supportEmail: "tgboyzz007@gmail.com",
          appVersion: "1.0.0",
          appDownloadUrl: "https://178-238-236-200.sslip.io/download",
        },
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Fetch system config error:", error);
    // fallback config
    return NextResponse.json({
      supportMobile: "9962188600",
      supportEmail: "tgboyzz007@gmail.com",
      appVersion: "1.0.0",
      appDownloadUrl: "https://178-238-236-200.sslip.io/download",
    }, { status: 200 });
  }
}
