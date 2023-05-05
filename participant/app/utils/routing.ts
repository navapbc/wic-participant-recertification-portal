import type { CountData, SubmissionData } from "~/types";
import { stringify } from "querystring";
import type { ParsedUrlQueryInput } from "querystring";
import { determineProof } from "./determineProof";
import { redirect } from "@remix-run/node";
import logger from "app/utils/logging.server";

export const routeRelative = (
  request: Request,
  target: string,
  params?: ParsedUrlQueryInput
) => {
  const url = new URL(request.url);
  const currentRouteParts: string[] =
    url.pathname.split("/") || ([] as string[]);
  const currentLocation = currentRouteParts[currentRouteParts.length - 1];
  const routeBase =
    currentLocation === "recertify"
      ? currentRouteParts
      : currentRouteParts.slice(0, -1);
  if (params) {
    const queryString = stringify(params);
    return `${[...routeBase, target].join("/")}?${queryString}`;
  }
  return [...routeBase, target].join("/");
};

export const throwRouteChangesRelative = (
  request: Request,
  currentLocation: string,
  target: string,
  acceptableRoutes?: string[]
) => {
  if (acceptableRoutes?.includes(currentLocation)) {
    return true;
  }
  if (request.url.includes(target)) {
    return true;
  }
  logger.info(
    {
      location: "routing",
      type: "checkroute",
      target: target,
      acceptableRoutes: acceptableRoutes,
    },
    `➡️ Redirecting to ${target} because of checkRoute; acceptable routes ${JSON.stringify(
      acceptableRoutes
    )}`
  );
  throw redirect(routeRelative(request, target));
};

export const checkRoute = (
  request: Request,
  submissionData: SubmissionData
) => {
  const url = new URL(request.url);
  const currentRouteParts: string[] =
    url.pathname.split("/") || ([] as string[]);
  const currentLocation = currentRouteParts[currentRouteParts.length - 1];
  const acceptableRoutes = ["", "recertify", "about"];
  if (currentLocation in acceptableRoutes) {
    return true;
  }
  if (!submissionData.name) {
    return throwRouteChangesRelative(
      request,
      currentLocation,
      "name",
      acceptableRoutes
    );
  }
  acceptableRoutes.push("name");
  if (!submissionData.participant || !submissionData.participant.length) {
    return throwRouteChangesRelative(request, currentLocation, "details", [
      ...acceptableRoutes,
      "count",
    ]);
  }
  acceptableRoutes.push("details");
  if (!submissionData.changes) {
    return throwRouteChangesRelative(
      request,
      currentLocation,
      "changes",
      acceptableRoutes
    );
  }
  acceptableRoutes.push("changes");
  const proofs = determineProof(submissionData);
  if (
    proofs?.length &&
    (!submissionData.documents || !submissionData.documents.length)
  ) {
    return throwRouteChangesRelative(
      request,
      currentLocation,
      "upload",
      acceptableRoutes
    );
  }
  acceptableRoutes.push("upload");
  if (!submissionData.contact) {
    return throwRouteChangesRelative(
      request,
      currentLocation,
      "contact",
      acceptableRoutes
    );
  }
  return true;
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
