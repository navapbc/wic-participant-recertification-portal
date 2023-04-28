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

if (!global.__s3Connection) {
  try {
    global.__s3Connection = createS3Client();
  } catch (e) {
    console.error(`‼️ Unable to connect to S3: {e}`);
  }
}

s3Connection = global.__s3Connection;

export default s3Connection;
