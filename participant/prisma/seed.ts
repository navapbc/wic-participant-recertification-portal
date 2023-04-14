import { PrismaClient } from "@prisma/client";
import {
  findSubmission,
  upsertSubmission,
  upsertSubmissionForm,
  findLocalAgency,
  firstLocalAgency,
  upsertLocalAgency,
} from "app/utils/db.server";
import agencyData from "public/data/local-agencies.json";
// import submissionsData from "public/data/submissions.not-prod.json";
import segfaultHandler from "node-segfault-handler";


const prisma = new PrismaClient();

// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  segfaultHandler.registerHandler();
  // Put the actions you need to take to seed the database here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)

  // Seed local agencies.
  await agencyData.forEach(async singleAgencyData => {
    const localAgency = await findLocalAgency(singleAgencyData.urlId);
    if (!localAgency || localAgency.name != singleAgencyData.name) {
      await upsertLocalAgency(singleAgencyData.urlId, singleAgencyData.name)
      console.log(`Seeding localAgency: ${singleAgencyData.urlId} 🌱`)
    }
  });

  // Seed submissions.
  // Create development submission seed records.
  // Object.entries(submissionsData).map(async ([singleAgencyId, singleAgencySubmissions]) => {
  //   const localAgency = await findLocalAgency(singleAgencyId);
  //   if (localAgency) {
  //     singleAgencySubmissions.forEach(async submission => {
  //       await upsertSubmission(submission.submissionId, localAgency.urlId);
  //       console.log("upserted submission")
  //       // for (let [formRoute, formData] of Object.entries(submission.forms)) {
  //       //   console.log("trying to upsert submission form")
  //       //   await upsertSubmissionForm(
  //       //     submission.submissionId,
  //       //     formRoute,
  //       //     formData
  //       //   );
  //       //   console.log("upserted submission form")
  //       // }
  //       console.log(`Seeding submission: ${submission.forms.name.firstName} ${submission.forms.name.lastName} 🌱`)
  //     });
  //   }
  // });
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
