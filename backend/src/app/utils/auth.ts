import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

/**
 * Hashes a password using PBKDF2 with a random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored hashed password.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue || !storedValue.includes(":")) {
    return false;
  }
  const [salt, originalHash] = storedValue.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

/**
 * Generates a unique 6-character referral code.
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Centralized helper to get the JWT secret.
 * Throws a critical error in production if the secret is missing.
 */
export function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is not set in production!");
    }
    return "fallback_secret_please_change";
  }
  return secret;
}

/**
 * Verifies the Authorization header token, retrieves the user, and throws if the user is blocked.
 */
export async function verifyUserSession(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (e) {
    throw new Error("Invalid session token");
  }

  if (!decoded || !decoded.id) {
    throw new Error("Invalid token payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new Error("User account not found");
  }

  if (user.isBlocked) {
    throw new Error("Your account has been blocked by the admin.");
  }

  // Device-level fraud check and state sharing mapping:
  if (user.deviceId) {
    // 1. If ANY user sharing this deviceId is blocked, block access entirely!
    const anyBlocked = await prisma.user.findFirst({
      where: { deviceId: user.deviceId, isBlocked: true },
      select: { id: true }
    });
    if (anyBlocked) {
      throw new Error("Your account has been blocked by the admin.");
    }

    // 2. Resolve to the canonical user (the first/oldest user registered on this device)
    const oldestUser = await prisma.user.findFirst({
      where: { deviceId: user.deviceId },
      orderBy: { createdAt: "asc" },
    });
    if (oldestUser) {
      return oldestUser;
    }
  }

  return user;
}

/**
 * Resolves a userId to the "canonical" userId (the oldest user registered on the same deviceId)
 * if the user has a deviceId.
 */
export async function getCanonicalUserId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deviceId: true }
  });

  if (!user || !user.deviceId) {
    return userId;
  }

  const oldestUser = await prisma.user.findFirst({
    where: { deviceId: user.deviceId },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  return oldestUser ? oldestUser.id : userId;
}
