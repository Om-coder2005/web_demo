import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "admin@khandoli.local";
const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin111" : "");
if (!password) throw new Error("Set ADMIN_PASSWORD before seeding the administrator account in production.");

await prisma.user.upsert({
  where: { email },
  update: { name: "System Administrator", role: "admin", passwordHash: await bcrypt.hash(password, 12), isActive: true },
  create: { email, name: "System Administrator", role: "admin", passwordHash: await bcrypt.hash(password, 12), isActive: true },
});
console.log("Administrator account is ready.");
await prisma.$disconnect();
