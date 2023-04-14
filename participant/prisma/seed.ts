import { PrismaClient } from "@prisma/client";
import {
  findLocalAgency,
  upsertLocalAgency,
} from "app/utils/db.server";
import agencyData from "public/data/local-agencies.json"

const prisma = new PrismaClient();
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the databse here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)

  for (const agency of agencyData) {
    const localAgency = await findLocalAgency(agency.urlId);
    if (!localAgency || localAgency.name != agency.name) {
      await upsertLocalAgency(agency.urlId, agency.name)
      console.log(`Seeding localAgency: ${agency.urlId} 🌱`)
    }
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
