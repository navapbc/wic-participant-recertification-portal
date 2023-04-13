import { PrismaClient } from "@prisma/client";

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
