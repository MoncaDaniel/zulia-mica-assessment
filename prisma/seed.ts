import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // ADMIN can see real contact details from the public lead-request form, so
  // it never gets the shared "password123" — a fresh, unpublished password
  // is generated on each seed run (or set ADMIN_SEED_PASSWORD yourself).
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? crypto.randomBytes(18).toString("base64url");
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mica-esma.tool" },
    update: { name: "Guest Admin" },
    create: {
      name: "Guest Admin",
      email: "admin@mica-esma.tool",
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log(`Generated ADMIN password for ${admin.email}: ${adminPassword}`);
  }

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@mica-esma.tool" },
    update: { name: "Guest Analyst" },
    create: {
      name: "Guest Analyst",
      email: "analyst@mica-esma.tool",
      password: passwordHash,
      role: Role.ANALYST,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@mica-esma.tool" },
    update: { name: "Guest Reviewer" },
    create: {
      name: "Guest Reviewer",
      email: "reviewer@mica-esma.tool",
      password: passwordHash,
      role: Role.REVIEWER,
    },
  });

  // System account that owns every assessment produced by the public,
  // no-login "run a free assessment" flow. Not a real login — the password
  // is a random unusable hash, and nothing signs in as this user.
  const publicUser = await prisma.user.upsert({
    where: { email: "public@mica-esma.tool" },
    update: { name: "Public (free assessment)" },
    create: {
      name: "Public (free assessment)",
      email: "public@mica-esma.tool",
      password: await bcrypt.hash(`disabled-${Math.random()}`, 12),
      role: Role.ANALYST,
    },
  });

  // Demo assessment
  const assessment = await prisma.assessment.upsert({
    where: { id: "demo-assessment-001" },
    update: {},
    create: {
      id: "demo-assessment-001",
      tokenName: "Sample Token",
      ticker: "SMPL",
      status: "DRAFT",
      createdById: analyst.id,
    },
  });

  console.log("Seeded:", { admin, analyst, reviewer, publicUser, assessment });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
