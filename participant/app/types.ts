export type i18nKey = string;

export type legendStyleType = "default" | "large" | "srOnly" | undefined;

export type RouteType = "changes" | "contact" | "name";

export type ChangesData = {
  idChange: string;
  addressChange: string;
};

export type ContactData = {
  phoneNumber: string;
  additionalInfo: string;
};

export type RepresentativeNameData = {
  "representative-firstName": string;
  "representative-lastName": string;
  "representative-preferredName": string;
};
