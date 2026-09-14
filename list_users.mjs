import { PrismaClient } from "./node_modules/.prisma/client/index.js";

async function main() {
  const p = new PrismaClient();
  const users = await p.user.findMany();
  console.log(JSON.stringify(users, null, 2));
  await p.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});