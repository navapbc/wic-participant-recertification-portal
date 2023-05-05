import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  NotFound,
} from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import s3Connection from "app/utils/s3.connection";
import {
  BUCKET,
  ENDPOINT_URL,
  S3_UPLOAD_RETRIES,
} from "app/utils/config.server";
import { PassThrough } from "stream";
import { writeAsyncIterableToWritable } from "@remix-run/node";
import { fileTypeFromBuffer } from "file-type";
import type { FileCheckResult } from "app/types";
import {
  MAX_UPLOAD_SIZE_BYTES,
  S3_PRESIGNED_URL_EXPIRATION,
} from "./config.server";
import { trimStart } from "lodash";
import { File } from "@remix-run/node/dist/fetch";
import logging from "app/utils/logging.server";

const PATHSTYLE = ENDPOINT_URL ? true : false;

const validSize = (size: number): boolean => {
  return size < MAX_UPLOAD_SIZE_BYTES;
};

export const parseKeyFromS3URL = (s3URL: string) => {
  const parsedURL = new URL(s3URL);
  if (PATHSTYLE) {
    const pathParts = parsedURL.pathname.split("/");
    return pathParts.slice(2).join("/");
  }
  return trimStart(parsedURL.pathname, "/");
};

export const getFileFromS3 = async (key: string): Promise<File | undefined> => {
  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  try {
    const getResponse = await s3Connection.send(command);
    if (getResponse.Body) {
      const data = await getResponse.Body.transformToString();
      return new File([data], key);
    }
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    logging.error(
      { location: "s3.server", type: "error.getFile", key: key, error: error },
      `Unable to get ${key} from S3: ${error}`
    );
    throw new Error(`Unable to get ${key} from S3: ${error}`);
  }
  return undefined;
};

export const readFileHeadFromS3 = async (
  key: string
): Promise<Uint8Array | undefined> => {
  const command = new GetObjectCommand({
    Key: key,
    Bucket: BUCKET,
    Range: "bytes=0-2047",
  });
  try {
    const getResponse = await s3Connection.send(command);
    if (getResponse.Body) {
      return await getResponse.Body.transformToByteArray();
    }
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    logging.error(
      {
        location: "s3.server",
        type: "error.readFileHead",
        key: key,
        error: error,
      },
      `Unable to read Head of ${key} from S3: ${error}`
    );
    throw new Error(`Unable to read Head of ${key} from S3: ${error}`);
  }
  return undefined;
};

export const headFilesizeFromS3 = async (
  key: string
): Promise<number | undefined> => {
  const command = new HeadObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  try {
    const headResponse = await s3Connection.send(command);
    return headResponse.ContentLength;
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    logging.error(
      {
        location: "s3.server",
        type: "error.headFilesize",
        key: key,
        error: error,
      },
      `Unable to complete head request for ${key}: ${error}`
    );
    throw new Error(`Unable to complete head request for ${key}: ${error}`);
  }
};

export const getURLFromS3 = async (
  key: string,
  action: "GET" | "PUT" = "GET",
  duration?: number
): Promise<string | undefined> => {
  const expiresIn = duration || S3_PRESIGNED_URL_EXPIRATION;
  const s3command = action === "GET" ? GetObjectCommand : PutObjectCommand;
  const command = new s3command({
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
    logging.error(
      { location: "s3.server", type: "error.getURL", key: key, error: error },
      `Unable to get URL for ${key}: ${error}`
    );
    throw new Error(`Unable to get URL for ${key}: ${error}`);
  }
};

export const deleteFileFromS3 = async (key: string) => {
  const command = new DeleteObjectCommand({
    Key: key,
    Bucket: BUCKET,
  });
  try {
    await s3Connection.send(command);
    logging.info(
      { location: "s3.server", type: "info.deleteFile", key: key },
      `🗑️  Deleted ${key}`
    );
  } catch (error) {
    // If it doesn't exist, it seems like an OK outcome for a delete request
    if (error! instanceof NotFound) {
      return;
    } else {
      logging.error(
        {
          location: "s3.server",
          type: "error.deleteFile",
          key: key,
          error: error,
        },
        `Unable to delete ${key}: ${error}`
      );
      throw new Error(`Unable to delete ${key}: ${error}`);
    }
  }
};

// @TODO move checkFile() into a separate file.
// Importing s3.server.ts outside of remix (such as in prisma seed scripts)
// is blocked because the `file-type` package doesn't want to import properly.
export const checkFile = async (key: string): Promise<FileCheckResult> => {
  const fileSize = await headFilesizeFromS3(key);
  if (!fileSize) {
    return { error: "notFound" };
  } else if (!validSize(fileSize)) {
    return { error: "invalidSize", size: fileSize };
  }

  const startOfFile = await readFileHeadFromS3(key);
  if (!startOfFile) {
    logging.warn(
      {
        location: "s3.server",
        type: "checkfile.cannotRead",
        key: key,
        fileSize: fileSize,
      },
      `❌ Unable to get head of file for ${key}`
    );
    return { error: "cannotRead", size: fileSize };
  }
  const fileType = await fileTypeFromBuffer(startOfFile);
  if (!fileType) {
    logging.warn(
      {
        location: "s3.server",
        type: "checkfile.cannotType",
        key: key,
        fileSize: fileSize,
      },
      `❌ Unable to determine filetype for ${key}`
    );
    return { error: "cannotType", size: fileSize };
  }
  if (fileType.mime.includes("image") || fileType.mime == "application/pdf") {
    return { mimeType: fileType.mime, size: fileSize };
  }
  return { mimeType: fileType.mime, error: "invalidType", size: fileSize };
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
  const stream = uploadStream({
    Key: filename,
  });
  await writeAsyncIterableToWritable(data, stream.writeStream);
  for (let retries = 0; retries < S3_UPLOAD_RETRIES; retries++) {
    try {
      const file = await stream.promise;
      if ("Location" in file) {
        if (PATHSTYLE) {
          // Workaround to ensure we're logging valid URLs in dev
          // The port number is missing from file.Location
          return `${ENDPOINT_URL}/${file.Bucket}/${file.Key}`;
        }
        return file.Location;
      }
    } catch (e) {
      logging.error(
        { location: "s3.server", type: "uploadStream", filename: filename },
        `⚠️ File upload failed: ${e}; retrying ${
          retries + 1
        } of ${S3_UPLOAD_RETRIES}`
      );
    }
  }
  throw new Error(`Upload of ${filename} to S3 aborted!`);
}
