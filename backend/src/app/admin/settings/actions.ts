"use server";

import { prisma } from "@/app/utils/db";
import { hashPassword } from "@/app/utils/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function updateAdminCredentials(email: string, newPassword?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized access." };
    }

    const adminId = (session.user as any).id;
    if (!adminId) {
      return { success: false, error: "Admin session user ID not found." };
    }

    // Clean and validate email
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: "Email cannot be empty." };
    }

    // Verify if email is already in use by another user
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: adminId },
      },
    });

    if (emailConflict) {
      return { success: false, error: "Email address is already in use." };
    }

    const updateData: any = {
      email: cleanEmail,
    };

    if (newPassword && newPassword.trim().length >= 6) {
      updateData.password = hashPassword(newPassword.trim());
    } else if (newPassword && newPassword.trim().length > 0) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    await prisma.user.update({
      where: { id: adminId },
      data: updateData,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update admin credentials:", error.message);
    return { success: false, error: error.message || "Failed to update settings." };
  }
}

export async function updateSystemConfig(
  supportMobile: string,
  supportEmail: string,
  appVersion: string,
  appDownloadUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized access." };
    }

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        supportMobile: supportMobile.trim(),
        supportEmail: supportEmail.trim(),
        appVersion: appVersion.trim(),
        appDownloadUrl: appDownloadUrl.trim(),
      },
      create: {
        id: "default",
        supportMobile: supportMobile.trim(),
        supportEmail: supportEmail.trim(),
        appVersion: appVersion.trim(),
        appDownloadUrl: appDownloadUrl.trim(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update system config:", error.message);
    return { success: false, error: error.message || "Failed to update system config." };
  }
}

