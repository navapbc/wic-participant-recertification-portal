import type { ChangesData, CountData, SubmissionData } from "~/types";
import { stringify } from "querystring";
import type { ParsedUrlQueryInput } from "querystring";
import { determineProof } from "./determineProof";

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
  submissionData: SubmissionData
): string {
  const proofs = determineProof(submissionData);
  if (proofs?.length) {
    return routeRelative(request, "upload");
  }
  return routeRelative(request, "contact");
}

export function routeFromDetails(request: Request) {
  return routeRelative(request, "changes");
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
