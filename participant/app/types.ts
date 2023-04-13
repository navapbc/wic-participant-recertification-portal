export type i18nKey = string;

export type legendStyleType = "default" | "large" | "srOnly" | undefined;

export type RouteType = "changes" | "contact";

export type ChangesData = {
  idChange: string;
  addressChange: string;
};

export type ContactData = {
  phoneNumber: string;
  additionalInfo: string;
};
