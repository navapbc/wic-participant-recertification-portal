import { Params } from "@remix-run/react";
import { findLocalAgency, firstLocalAgency } from "./db.server";

export const validRoute = async (
  request: Request,
  params?: Params<string>,
  findRoot: boolean = false
) => {
  const url = new URL(request.url);
  let redirectToFirstAgency = !params?.localAgency;
  let validAgencyId = "";
  if (params?.localAgency) {
    const agency = await findLocalAgency(params.localAgency);
    if (agency) {
      validAgencyId = agency.urlId;
    } else {
      redirectToFirstAgency = true;
    }
  } else {
    // If the user is at `/localAgency` it won't be in params
    const firstSegment = url.pathname.split("/")[1];
    if (firstSegment) {
      const agency = await findLocalAgency(firstSegment);
      if (agency) {
        redirectToFirstAgency = false;
        validAgencyId = agency.urlId;
      }
    }
    if (!validAgencyId) {
      redirectToFirstAgency = true;
    }
  }
  if (redirectToFirstAgency) {
    const agency = await firstLocalAgency();
    if (!agency) {
      return null;
    }
    return `/${agency.urlId}/recertify`;
  }
  if (!url.pathname.includes("recertify") || findRoot) {
    return `/${validAgencyId}/recertify`;
  }
  return null;
};
