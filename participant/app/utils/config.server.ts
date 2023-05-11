export const MAX_UPLOAD_SIZE_BYTES =
  parseInt(process.env.MAX_UPLOAD_SIZE_BYTES!) || 26_214_400;
export const MAX_UPLOAD_FILECOUNT =
  parseInt(process.env.MAX_UPLOAD_FILECOUNT!) || 20;
export const MAX_SESSION_SECONDS =
  Number(process.env.MAX_SESSION_SECONDS) || 1800;
export const S3_PRESIGNED_URL_EXPIRATION =
  Number(process.env.S3_PRESIGNED_URL_EXPIRATION) || 604800;
export const S3_PRESIGNED_URL_RENEWAL_THRESHOLD =
  Number(process.env.S3_PRESIGNED_URL_RENEWAL_THRESHOLD) || 25200;
export const REGION = process.env.AWS_REGION || "us-west-2";
export const ENDPOINT_URL = process.env.S3_ENDPOINT_URL || "";
export const BUCKET = process.env.S3_BUCKET || "participant-uploads";
export const MATOMO_URL_BASE = process.env.MATOMO_URL_BASE || ""; // this is the analytics dashboard link
export const MATOMO_SECURE =
  process.env.NODE_ENV == "production" ? true : false;
export const S3_UPLOAD_RETRIES = Number(process.env.S3_UPLOAD_RETRIES) || 3;
export const LOG_LEVEL = process.env.LOG_LEVEL || "warn";
