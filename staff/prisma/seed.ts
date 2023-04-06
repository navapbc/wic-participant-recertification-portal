import { PrismaClient } from "@prisma/client";
import {
  findSubmission,
  upsertSubmission,
  upsertSubmissionForm,
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
const submissionsData = {
  gallatin: [
    {
      submissionId: uuidv4(),
      forms: {
        name: {
          firstName: "Abigail",
          lastName: "Cho",
        },
        changes: {
          idChange: "no",
          addressChange: "no",
        },
        count: {
          householdSize: 1,
        },
        details: {
          1: {
            relationship: "child",
            firstName: "Mandy",
            lastName: "Cho",
            dateOfBirth: "04/02/2022",
            adjunctive: "fdpir",
          },
        },
        contact: {
          phoneNumber: "(406) 987 - 6543",
          updates: "",
        },
        documents: [
          {
            name: "hello.png",
          },
        ],
      },
    },
  ],
  missoula: [],
};

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
  const gallatin = await findLocalAgency("gallatin");
  const missoula = await findLocalAgency("missoula");

  if (gallatin && missoula) {
    for (let [localAgencyUrlId, submissions] of Object.entries(
      submissionsData
    )) {
      for (const submission of submissions) {
        await upsertSubmission(submission.submissionId, localAgencyUrlId);
        for (let [formRoute, formData] of Object.entries(submission.forms)) {
          await upsertSubmissionForm(
            submission.submissionId,
            formRoute,
            formData
          );
        }
      }
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
