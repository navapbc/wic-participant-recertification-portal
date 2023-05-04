import type { DocumentList } from "./utils/db.server";

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

export type RouteType = "changes" | "contact" | "count" | "name" | "details";
export type RelationshipType =
  | "self"
  | "child"
  | "grandchild"
  | "foster"
  | "other";
export type ChangesData = {
  idChange: string;
  addressChange: string;
};

export type FileCheckResult = {
  mimeType?: string;
  error?: FileCheckError;
  size?: number;
};

export type Participant = {
  relationship: RelationshipType;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: {
    day: number;
    month: number;
    year: number;
  };
  adjunctive: "yes" | "no";
  tag?: string;
};

export type ParticipantForm = {
  participant: Participant[];
};

export type SubmittedFile = {
  filename: string;
  error?: FileCheckError;
  accepted: boolean;
  url?: string;
  s3Url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
};

export type PreviousUpload = {
  url: string;
  name: string;
};

export type ContactData = {
  phoneNumber: string;
  additionalInfo: string;
};

export type CountData = {
  householdSize: number;
};

export type NameData = {
  firstName: string;
  lastName: string;
  preferredName?: string;
};

export type SubmissionData = {
  name?: NameData;
  changes?: ChangesData;
  participant?: Participant[];
  contact?: ContactData;
  count?: CountData;
  documents?: DocumentList;
};
