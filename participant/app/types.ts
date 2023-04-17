export type i18nKey = string;

export type legendStyleType = "default" | "large" | "srOnly" | undefined;

export type RouteType = "changes" | "name";

export type ChangesData = {
  idChange: string;
  addressChange: string;
};

export type RepresentativeNameData = {
  "representative-firstName": string;
  "representative-lastName": string;
  "representative-preferredName": string;
};
