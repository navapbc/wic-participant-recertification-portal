import { PrismaClient } from "@prisma/client";
import {
  findLocalAgency,
  findSubmission,
  upsertLocalAgency,
  upsertSubmission,
  upsertSubmissionForm,
  upsertDocument,
} from "app/utils/db.server";
import { processUpload } from "app/routes/$localAgency/recertify/upload"
import seedAgencies from "public/data/local-agencies.json";
import seedSubmissions from "public/data/submissions.json";
import type { SubmittedFile } from "app/types";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { createReadStream } from "fs";

// Define a bunch of types to make typescript happy for the case where
// seedSubmissions is empty. Otherwise, typescript is usually able to
// infer all the types.
export type NameFormType = {
  firstName: string;
  lastName: string;
  preferredName?: string;
};

export type SeedDataType = {
  [key: string]: string;
};

export type SeedSubmissionFormsType = {
  name: NameFormType;
  [key: string]: SeedDataType | SeedDataType[];
};

export type SeedDocumentType = {
  displayFilename: string;
  filepath: string;
};

export type SeedAgencySubmissionsType = {
  submissionId: string;
  forms: SeedSubmissionFormsType;
  documents: SeedDocumentType[];
};

export type SeedSubmissionsType = {
  [key: string]: SeedAgencySubmissionsType[];
};

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
  for (const [seedAgencyUrlId, seedAgencySubmissions] of Object.entries(
    seedSubmissions as unknown as SeedSubmissionsType
  )) {
    const localAgency = await findLocalAgency(seedAgencyUrlId);
    if (localAgency) {
      for (const seedSubmission of seedAgencySubmissions) {
        const submission = await findSubmission(seedSubmission.submissionId);
        if (!submission) {
          const upsertedSubmission = await upsertSubmission(
            seedSubmission.submissionId,
            localAgency.urlId
          );
          for (let [seedFormRoute, seedFormData] of Object.entries(
            seedSubmission.forms
          )) {
            await upsertSubmissionForm(
              seedSubmission.submissionId,
              seedFormRoute,
              seedFormData
            );
          }
          if (seedSubmission.documents) {
            for (let seedDocument of seedSubmission.documents) {
              const fileStream = sdkStreamMixin(
                createReadStream(seedDocument.filepath)
              );
              const stringifiedJson = await processUpload(
                upsertedSubmission.submissionId,
                seedDocument.displayFilename,
                fileStream
              );
              await upsertDocument(
                seedSubmission.submissionId,
                JSON.parse(stringifiedJson) as SubmittedFile
              );
            }
          }

          console.log(
            `Seeding submission: ${seedSubmission.forms.name.firstName} ${seedSubmission.forms.name.lastName} 🌱`
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
