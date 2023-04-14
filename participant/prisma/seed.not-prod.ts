// @TODO Temporarily put this seed data in a separate seed file just for the staff portal.
// This should get dynamically seeded to the database for lower environments and for local development.
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
        details: [
          {
            relationship: "child",
            firstName: "Mandy",
            lastName: "Cho",
            dateOfBirth: "04/02/2022",
            adjunctive: "fdpir",
          },
        ],
        contact: {
          phoneNumber: "(406) 987 - 6543",
          updates: "",
        },
        documents: [
          {
            name: "febpaystubs.pdf",
            href: "https://google.com",
          },
          {
            name: "marchpaystub.png",
            href: "https://duckduckgo.com",
          },
        ],
      },
    },
    {
      submissionId: uuidv4(),
      forms: {
        name: {
          firstName: "Nicholas",
          lastName: "Brown",
          preferredName: "Nick Brown",
        },
        changes: {
          idChange: "no",
          addressChange: "yes",
        },
        details: [
          {
            relationship: "self",
            firstName: "Nicholas",
            lastName: "Brown",
            preferredName: "Nick Brown",
            dateOfBirth: "07/03/1993",
            adjunctive: "snap",
          },
          {
            relationship: "child",
            firstName: "Zoe",
            lastName: "Brown",
            dateOfBirth: "03/03/2020",
            adjunctive: "snap",
          },
          {
            relationship: "child",
            firstName: "Mia",
            lastName: "Brown",
            dateOfBirth: "03/03/2020",
            adjunctive: "snap",
          },
          {
            relationship: "child",
            firstName: "Mason",
            lastName: "Brown",
            dateOfBirth: "10/14/2022",
            adjunctive: "snap",
          },
        ],
        contact: {
          phoneNumber: "(406) 123 - 4567",
          updates:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        },
        documents: [
          {
            name: "electric.pdf",
            href: "https://google.com",
          },
        ],
      },
    },
  ],
  missoula: [
    {
      submissionId: uuidv4(),
      forms: {
        name: {
          firstName: "Elizabeth",
          lastName: "Schneider",
          preferredName: "Liz",
        },
        changes: {
          idChange: "no",
          addressChange: "no",
        },
        details: [
          {
            relationship: "self",
            firstName: "Elizabeth",
            lastName: "Schneider",
            preferredName: "Liz",
            dateOfBirth: "11/21/1990",
            adjunctive: "",
          },
          {
            relationship: "child",
            firstName: "Seth",
            lastName: "Schneider",
            dateOfBirth: "02/23/2023",
            adjunctive: "",
          },
        ],
        contact: {
          phoneNumber: "(406) 321 - 7654",
          updates:
            "Seth is healthy and spirited! But I’m having issues with latching.",
        },
      },
    },
  ],
};

// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the database here.
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
