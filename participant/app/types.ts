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
  relationship: "self" | "child" | "grandchild" | "foster" | "other";
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

export type RepresentativeNameData = {
  "representative-firstName": string;
  "representative-lastName": string;
  "representative-preferredName": string;
};
