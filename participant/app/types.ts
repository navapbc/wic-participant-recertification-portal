export type i18nKey = string;

export type legendStyleType = "default" | "large" | "srOnly" | undefined;
export type Proofs = "income" | "address" | "identity";
export type FileCheckError =
  | "notFound"
  | "cannotRead"
  | "cannotType"
  | "invalidSize"
  | "invalidType"
  | "fileCount";
export type RouteType = "changes";

export type ChangesData = {
  idChange: string;
  addressChange: string;
};

export type FileCheckResult = {
  mimeType?: string;
  error?: FileCheckError;
  size?: number;
};

export type SubmittedFile = {
  filename: string;
  error?: FileCheckError;
  accepted: boolean;
  url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
};

export type PreviousUpload = {
  url: string;
  name: string;
};
