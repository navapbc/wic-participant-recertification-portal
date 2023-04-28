import { PrismaClient } from "@prisma/client";
import {
  findLocalAgency,
  upsertLocalAgency,
  upsertSubmission,
  upsertSubmissionForm,
  upsertDocument,
} from "app/utils/db.server";
import seedAgencies from "public/data/local-agencies.json";
import seedSubmissions from "public/data/submissions.json";
import {
  GetObjectCommand,
  NotFound,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Connection, { ensureBucketExists } from "app/utils/s3.connection";
import { BUCKET, S3_PRESIGNED_URL_EXPIRATION } from "app/utils/config.server";
import { readFileSync } from "fs";

// Define a bunch of types to make typescript happy for the case where
// seedSubmissions is empty. Otherwise, typescript is usually able to
// infer all the types.
export type NameFormType = {
  firstName: string;
  lastName: string;
  preferredName?: string;
};

export type SeedDataType = {
  [key: string]: string | number;
};

export type SeedSubmissionFormsType = {
  name: NameFormType;
  [key: string]: SeedDataType | SeedDataType[];
};

export type SeedDocumentType = {
  displayFilename: string;
  filepath: string;
  filesize: number;
  filetype: string;
};

export type SeedAgencySubmissionsType = {
  submissionId: string;
  submitted: boolean;
  forms: SeedSubmissionFormsType;
  documents: SeedDocumentType[];
};

export type SeedSubmissionsType = {
  [key: string]: SeedAgencySubmissionsType[];
};

// Get the presigned s3 url for an object in s3.
// We cannot use getUrlFromS3() because of issues importing s3.server.ts
// outside of remix because we are using file-type to get the filetype.
// Instead, reproduce the function here.
// @TODO to move the blocking function (checkFile) that needs the `file-type`
// package into a separate file, so we don't have to do this workaround.
export const getURLFromS3 = async (
  key: string,
  duration?: number
): Promise<string | undefined> => {
  await ensureBucketExists(s3Connection);
  const expiresIn = duration || S3_PRESIGNED_URL_EXPIRATION;
  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  try {
    const signedUrl = await getSignedUrl(s3Connection, command, {
      expiresIn: expiresIn,
    });
    return signedUrl;
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    throw new Error(`Unable to get URL for ${key}: ${error}`);
  }
};

// Upload a seed document to s3 and save it to the database.
// @TODO probably better to move this into s3.server.ts
export const uploadDocument = async (
  submissionId: string,
  filename: string,
  filepath: string,
  filesize: number,
  filetype: string
) => {
  try {
    const uploadKey = [submissionId, filename].join("/");
    // Read in the contents of the seed document.
    const fileBlob = readFileSync(filepath);
    // Create the bucket if necessary.
    await ensureBucketExists(s3Connection);
    // Put the object into s3.
    const command = new PutObjectCommand({
      Body: fileBlob,
      Bucket: BUCKET,
      Key: uploadKey,
    });
    await s3Connection.send(command);
    // Get s3 presigned url for the object.
    const s3Url = await getURLFromS3(uploadKey);
    // Construct the record to save to the database.
    const submittedFile = {
      filename: filename,
      accepted: true,
      s3Url: s3Url,
      key: uploadKey,
      size: filesize,
      mimeType: filetype,
    };
    await upsertDocument(submissionId, submittedFile);
  } catch (error) {
    console.log(
      `❌ Error attempting to seed document ${filename}; skipping. Error: ${error}`
    );
  }
};

const prisma = new PrismaClient();
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the database here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)

  // Seed local agencies.
  for (const seedAgency of seedAgencies) {
    const localAgency = await findLocalAgency(seedAgency.urlId);
    if (!localAgency || localAgency.name != seedAgency.name) {
      await upsertLocalAgency(seedAgency.urlId, seedAgency.name);
      console.log(`Seeding localAgency: ${seedAgency.urlId} 🌱`);
    } else {
      console.log(`No need to seed localAgency: ${seedAgency.urlId} 🪴`);
    }
  }

  // Seed submissions.
  for (const [seedAgencyUrlId, seedAgencySubmissions] of Object.entries(
    seedSubmissions as unknown as SeedSubmissionsType
  )) {
    const localAgency = await findLocalAgency(seedAgencyUrlId);
    if (localAgency) {
      for (const seedSubmission of seedAgencySubmissions) {
        await upsertSubmission(seedSubmission.submissionId, localAgency.urlId, seedSubmission.submitted);
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
            await uploadDocument(
              seedSubmission.submissionId,
              seedDocument.displayFilename,
              seedDocument.filepath,
              seedDocument.filesize,
              seedDocument.filetype
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

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
