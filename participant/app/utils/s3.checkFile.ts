import { fileTypeFromBuffer } from "file-type";
import type { FileCheckResult } from "app/types";
import { MAX_UPLOAD_SIZE_BYTES } from "app/utils/config.server";
import { headFilesizeFromS3, readFileHeadFromS3 } from "./s3.server";
import logger from "app/utils/logging.server";
// Importing s3.server.ts outside of remix (such as in prisma seed scripts)
// is blocked because the `file-type` package doesn't want to import properly.

const validSize = (size: number): boolean => {
  return size < MAX_UPLOAD_SIZE_BYTES;
};

export const checkFile = async (key: string): Promise<FileCheckResult> => {
  const fileSize = await headFilesizeFromS3(key);
  if (!fileSize) {
    return { error: "notFound" };
  } else if (!validSize(fileSize)) {
    return { error: "invalidSize", size: fileSize };
  }

  const startOfFile = await readFileHeadFromS3(key);
  if (!startOfFile) {
    logger.warn(
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
    logger.warn(
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
