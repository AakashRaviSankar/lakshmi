import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/utils/db";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const admin = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { email: true },
  });

  if (!admin) {
    redirect("/");
  }

  let systemConfig = await prisma.systemConfig.findUnique({
    where: { id: "default" },
  });

  if (!systemConfig) {
    systemConfig = await prisma.systemConfig.create({
      data: {
        id: "default",
        supportMobile: "9962188600",
        supportEmail: "tgboyzz007@gmail.com",
        appVersion: "1.0.0",
        appDownloadUrl: "https://178-238-236-200.sslip.io/download",
      },
    });
  }

  return (
    <SettingsForm
      initialEmail={admin.email || ""}
      initialConfig={{
        supportMobile: systemConfig.supportMobile,
        supportEmail: systemConfig.supportEmail,
        appVersion: systemConfig.appVersion,
        appDownloadUrl: systemConfig.appDownloadUrl,
      }}
    />
  );
}
