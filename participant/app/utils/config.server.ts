export const MAX_UPLOAD_SIZE_BYTES =
  parseInt(process.env.MAX_UPLOAD_SIZE_BYTES!) || 26_214_400;
export const MAX_UPLOAD_FILECOUNT =
  parseInt(process.env.MAX_UPLOAD_FILECOUNT!) || 20;
export const MAX_SESSION_SECONDS =
  Number(process.env.MAX_SESSION_SECONDS) || 1800;
export const DOC_URL_EXPIRATION =
  Number(process.env.DOC_URL_EXPIRATION) || 604800;
export const REGION = process.env.AWS_REGION || "us-west-2";
export const ENDPOINT_URL = process.env.S3_ENDPOINT_URL || "";
export const BUCKET = process.env.S3_BUCKET || "participant-uploads";
