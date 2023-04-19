import type { ChangesData } from "~/types";

export const routeRelative = (request: Request, target: string) => {
  const url = new URL(request.url);
  const currentRouteParts: string[] =
    url.pathname.split("/") || ([] as string[]);
  return [...currentRouteParts.slice(0, -1), target].join("/");
};

export function routeFromChanges(
  request: Request,
  submissionForm: ChangesData
): string {
  if (
    submissionForm.idChange == "yes" ||
    submissionForm.addressChange == "yes"
  ) {
    return routeRelative(request, "upload");
  }
  return routeRelative(request, "contact");
}

export function routeFromContact(request: Request): string {
  return routeRelative(request, "review");
}

export function routeFromName(request: Request): string {
  return routeRelative(request, "count");
}
