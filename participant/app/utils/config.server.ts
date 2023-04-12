export const MAX_UPLOAD_SIZE_BYTES =
  parseInt(process.env.MAX_UPLOAD_SIZE_BYTES!) || 26_214_400;
export const MAX_UPLOAD_FILECOUNT =
  parseInt(process.env.MAX_UPLOAD_FILECOUNT!) || 20;
export const MAX_SESSION_SECONDS =
  Number(process.env.MAX_SESSION_SECONDS) || 1800;
