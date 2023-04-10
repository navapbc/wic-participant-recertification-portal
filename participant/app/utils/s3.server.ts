import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import {
  s3Connection,
  BUCKET,
  ensureBucketExists,
  ENDPOINT_URL,
} from "app/utils/s3.connection";
import { PassThrough } from "stream";
import { writeAsyncIterableToWritable } from "@remix-run/node";

export const getFileFromS3 = async (key: string) => {
  await ensureBucketExists(s3Connection);
  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  const getResponse = await s3Connection.send(command);
  if (getResponse.Body) {
    const data = await getResponse.Body.transformToString();
    return new File([data], key);
  }
};

export const getURLFromS3 = async (key: string, duration?: number) => {
  await ensureBucketExists(s3Connection);
  const expiresIn = duration || 3600;
  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  return await getSignedUrl(s3Connection, command, { expiresIn: expiresIn });
};

// Thank you 🙏🏻 to https://github.com/remix-run/examples/issues/163
const uploadStream = ({ Key }: Pick<PutObjectCommandInput, "Key">) => {
  const pass = new PassThrough();
  return {
    writeStream: pass,
    promise: new Upload({
      params: {
        Body: pass,
        Bucket: BUCKET,
        Key,
      },
      client: s3Connection,
    }).done(),
  };
};

export async function uploadStreamToS3(data: any, filename: string) {
  await ensureBucketExists(s3Connection);
  const stream = uploadStream({
    Key: filename,
  });
  await writeAsyncIterableToWritable(data, stream.writeStream);
  const file = await stream.promise;
  if ("Location" in file) {
    if (ENDPOINT_URL) {
      // Workaround to ensure we're logging valid URLs in dev
      // The port number is missing from file.Location
      return `${ENDPOINT_URL}/${file.Bucket}/${file.Key}`;
    }
    return file.Location;
  }
  throw new Error(`Upload of ${filename} to S3 aborted!`);
}
