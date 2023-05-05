// A batch script to update s3 presigned urls saved to the database.
// Intended to be run in a lambda.
import { PrismaClient } from "@prisma/client";
import { listExpiringDocuments } from "app/utils/db.server";
import s3Connection from "app/utils/s3.connection";
import { GetObjectCommand, NotFound } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
// Any interactions with Prisma will be async
// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  const documentsToRefresh = listExpiringDocuments()
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
