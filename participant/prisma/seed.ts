import { PrismaClient } from "@prisma/client";
import {
  findLocalAgency,
  findSubmission,
  upsertLocalAgency,
  upsertSubmission,
  upsertSubmissionForm
} from "app/utils/db.server";
import seedAgencies from "public/data/local-agencies.json"
import seedSubmissions from "public/data/submissions.not-prod.json"

const prisma = new PrismaClient();
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the databse here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)

  // Seed local agencies.
  for (const seedAgency of seedAgencies) {
    const localAgency = await findLocalAgency(seedAgency.urlId);
    if (!localAgency || localAgency.name != seedAgency.name) {
      await upsertLocalAgency(seedAgency.urlId, seedAgency.name);
      console.log(`Seeding localAgency: ${seedAgency.urlId} 🌱`);
    }
  }

  // Seed submissions.
  for (const [seedAgencyUrlId, seedAgencySubmissions] of Object.entries(seedSubmissions)) {
    const localAgency = await findLocalAgency(seedAgencyUrlId);
    if (localAgency) {
      for (const seedSubmission of seedAgencySubmissions) {
        const submission = await findSubmission(seedSubmission.submissionId);
        if (!submission) {
          await upsertSubmission(seedSubmission.submissionId, localAgency.urlId);
          for (let [seedFormRoute, seedFormData] of Object.entries(seedSubmission.forms)) {
            await upsertSubmissionForm(
              seedSubmission.submissionId,
              seedFormRoute,
              seedFormData
            );
          }
          console.log(`Seeding submission: ${seedSubmission.forms.name.firstName} ${seedSubmission.forms.name.lastName} 🌱`);
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
