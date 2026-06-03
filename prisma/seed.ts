import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zulia.network" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@zulia.network",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@zulia.network" },
    update: {},
    create: {
      name: "Ana Analyst",
      email: "analyst@zulia.network",
      password: passwordHash,
      role: Role.ANALYST,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@zulia.network" },
    update: {},
    create: {
      name: "Rob Reviewer",
      email: "reviewer@zulia.network",
      password: passwordHash,
      role: Role.REVIEWER,
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

  console.log("Seeded:", { admin, analyst, reviewer, assessment });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
