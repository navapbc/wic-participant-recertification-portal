/* eslint-disable no-var */
// We cannot use a let or const in a global object
import {
  S3Client,
  CreateBucketCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { REGION, ENDPOINT_URL, BUCKET } from "app/utils/config.server";
let s3Connection: S3Client;

// This helps us not call S3 for every request to make sure the bucket exists
declare global {
  var __bucket_ensured: boolean | undefined;
  var __s3Connection: S3Client;
}

export const createS3Client = (): S3Client => {
  if (process.env.NODE_ENV === "production") {
    console.log(`🖥️ 🚢 Created S3Client in production mode`);
    return new S3Client({ region: REGION });
  } else {
    if (!ENDPOINT_URL) {
      console.error("No ENDPOINT_URL environment var defined!");
    }
    console.log(`🖥️ 🛠️ Created S3Client for endpoint url ${ENDPOINT_URL}`);
    return new S3Client({
      region: REGION,
      endpoint: ENDPOINT_URL,
      forcePathStyle: true,
    });
  }
};

export const ensureBucketExists = async (s3Client: S3Client) => {
  if (!global.__bucket_ensured) {
    console.log(`🪣 🛠️ Trying to create S3 Bucket ${BUCKET}`);
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`🪣 ✅ Created S3 Bucket ${BUCKET}`);
      global.__bucket_ensured = true;
    } catch (error) {
      if (error instanceof S3ServiceException) {
        if (
          error.name == "BucketAlreadyExists" ||
          error.name == "BucketAlreadyOwnedByYou"
        ) {
          console.log(`🪣 ✅ S3 Bucket ${BUCKET} already exists`);
          global.__bucket_ensured = true;
          return;
        } else {
          global.__bucket_ensured = false;
          throw new Error(
            `Caught S3 Service Exception creating bucket: ${error}`
          );
        }
      }
      throw new Error(`Unknown exception: ${error}`);
    }
  }
};

if (!global.__s3Connection) {
  global.__s3Connection = createS3Client();
}
s3Connection = global.__s3Connection;

export default s3Connection;
