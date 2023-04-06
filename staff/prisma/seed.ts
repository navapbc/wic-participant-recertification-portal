import { PrismaClient } from "@prisma/client";
import {
  findSubmission,
  upsertSubmission,
  findLocalAgency,
  firstLocalAgency,
} from "app/utils/db.server";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const agencyData = [
  {
    urlId: "gallatin",
    name: "Gallatin WIC",
  },
  {
    urlId: "missoula",
    name: "Missoula WIC",
  },
];
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the databse here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)
  const existingAgencyRecords = await prisma.localAgency.count();
  if (existingAgencyRecords != agencyData.length) {
    await prisma.localAgency.createMany({
      data: agencyData,
      skipDuplicates: true,
    });
    console.log(`Database has been seeded. 🌱`);
  } else {
    console.log(
      `Skipping localAgency seed; found ${existingAgencyRecords} agencies 🪴`
    );
  }

  // Create development submission seed records.
  const firstAgency = await firstLocalAgency();
  if (firstAgency) {
    console.log(`found agency: ${firstAgency.localAgencyId}`);
    await upsertSubmission(uuidv4(), firstAgency.urlId);
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
