import { PrismaClient } from "@prisma/client";
import { upsertStaffUser } from "app/utils/db.server";
import { BUCKET } from "app/utils/config.server";
import s3Connection, { ensureBucketExists } from "app/utils/s3.connection";
import { GetObjectCommand, NotFound } from "@aws-sdk/client-s3";

export const getJsonFromS3 = async (key: string): Promise<any | undefined> => {
  await ensureBucketExists(s3Connection);

  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  try {
    const getResponse = await s3Connection.send(command);
    if (getResponse.Body) {
      const data = await getResponse.Body.transformToString();
      return JSON.parse(data);
    }
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    throw new Error(`Unable to get ${key} from S3: ${error}`);
  }
  return undefined;
};

const prisma = new PrismaClient();
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  // Put the actions you need to take to seed the database here.
  // You can access relations as normal here
  // const users = await prisma.user.findMany(); // (for example)

  // infra-task: Create a new bucket for side-loading things
  // a way to run the ecs task definition with overrides:
  // - command
  // - env vars
  // new s3 bucket and just grant the task role permissions on that one too
  // manually run `aws ecs run-task`. don't write a whole shell script. unless it's actually helpful

  const seedStaffUsersKey = "seed/staff-uuids-to-agencies.json";
  console.log(`Attempting to seed staff users from ${BUCKET}/${seedStaffUsersKey}`);
  try {
    const seedStaffUsers = await getJsonFromS3(seedStaffUsersKey);
    if (seedStaffUsers) {
      for (const seedStaffUser of seedStaffUsers) {
        upsertStaffUser(
          seedStaffUser.localAgencyUrlId,
          seedStaffUser.staffUserId
        );
      }
      console.log(`Seeded ${seedStaffUsers.length} staff users 🌱`);
    }
  } catch (error) {
    console.log(`❌ Unable to retrieve ${seedStaffUsersKey} from ${BUCKET}`);
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
