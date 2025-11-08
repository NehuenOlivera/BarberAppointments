import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const hashedPassword = await bcrypt.hash("Youjfjmkv159753", SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Tester",
      email: "admin@example.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log("Admin created:", admin);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
