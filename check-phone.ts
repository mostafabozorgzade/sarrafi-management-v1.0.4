import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter });
  const result = await p.$queryRaw`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone'`;
  console.log(result);
  await p.$disconnect();
}
main();
