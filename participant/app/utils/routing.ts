import type { ChangesData, CountData } from "~/types";
import { stringify } from "querystring";
import type { ParsedUrlQueryInput } from "querystring";

export const routeRelative = (
  request: Request,
  target: string,
  params?: ParsedUrlQueryInput
) => {
  const url = new URL(request.url);
  const currentRouteParts: string[] =
    url.pathname.split("/") || ([] as string[]);
  if (params) {
    const queryString = stringify(params);
    return `${[...currentRouteParts.slice(0, -1), target].join(
      "/"
    )}?${queryString}`;
  }
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

export function routeFromCount(
  request: Request,
  submissionForm: CountData
): string {
  return routeRelative(request, "details", {
    count: submissionForm.householdSize,
  });
}

export function routeFromName(request: Request): string {
  return routeRelative(request, "count");
}
