import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the databse here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)
  await prisma.localAgency.createMany({
    data: [
      {
        urlId: "bozeman",
        name: "Bozeman WIC",
      },
      {
        urlId: "missoula",
        name: "Missoula WIC",
      },
    ],
  });
  console.log(`Database has been seeded. 🌱`);
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
