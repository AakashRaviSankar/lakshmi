const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const crypto = require("crypto");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=no-verify") ? false : {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@lottery.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin User";

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists in the database (Email: ${existingAdmin.email}).`);
  } else {
    const hashedPassword = hashPassword(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: "ADMIN",
        password: hashedPassword,
        referralCode: "ADMIN123",
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
    });

    console.log(`Successfully created default admin:`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Role: ${admin.role}`);
    console.log(`- Referral Code: ${admin.referralCode}`);
  }

  console.log("Seeding default system configuration...");
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {
      appVersion: "1.0.1",
    },
    create: {
      id: "default",
      supportMobile: "9962188600",
      supportEmail: "tgboyzz007@gmail.com",
      appVersion: "1.0.1",
      appDownloadUrl: "https://178-238-236-200.sslip.io/lakshmi.apk",
    },
  });
  console.log("✓ System configuration seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
