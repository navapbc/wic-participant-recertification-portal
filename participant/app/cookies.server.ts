import { createCookie } from "@remix-run/node"; // or "@remix-run/cloudflare"
import type { Params } from "@remix-run/react";
import { redirect } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { findSubmission, upsertSubmission } from "app/utils/db.server";
import { validRoute } from "app/utils/redirect";
import { MAX_SESSION_SECONDS } from "app/utils/config.server";
import { routeRelative } from "./utils/routing";

type ParticipantCookieContents = {
  submissionID?: string;
};

// This should be secure: true, and have secrets in prod (probably)
export const ParticipantCookie = createCookie("prp-recertification-form");

export const sessionCheck = (time: Date): boolean => {
  const age = (new Date().getTime() - time.getTime()) / 1000;
  if (age > MAX_SESSION_SECONDS) {
    console.log(
      `Session is not so fresh 🤢: ${age} seconds, max ${MAX_SESSION_SECONDS}`
    );
    return false;
  }
  return true;
};

export const cookieParser = async (
  request: Request,
  params?: Params<string>
) => {
  const cookie = ((await ParticipantCookie.parse(
    request.headers.get("Cookie")
  )) || {}) as ParticipantCookieContents;
  const url = new URL(request.url);
  const resetSession: boolean = url.searchParams.get("newSession") === "true";
  let forceRedirect: boolean = resetSession;
  const urlId = params?.localAgency || "";
  if (cookie) {
    if (cookie.submissionID) {
      const submissionID = cookie.submissionID;
      console.log(`Found ID ${submissionID} in cookie`);
      const existingSubmission = await findSubmission(submissionID);
      if (!existingSubmission) {
        // This is an edge case; we want to ensure the submissionID isn't subverted
        console.log(`No matching DB submission for ${submissionID}; resetting`);
        forceRedirect = true;
      } else if (!resetSession) {
        const validSession = sessionCheck(existingSubmission.updatedAt);
        if (validSession) {
          if (
            existingSubmission.submitted === true &&
            !request.url.includes("confirm")
          ) {
            const confirmAlreadySubmitted = routeRelative(request, "confirm", {
              previouslySubmitted: true,
            });
            console.log(
              `🗒️  Already submitted; redirect to ${confirmAlreadySubmitted}`
            );
            throw redirect(confirmAlreadySubmitted);
          }
          console.log(`Session ${submissionID} valid; finished parser`);
          return { submissionID: submissionID };
        }
      }
      forceRedirect = true;
    }
  }

  const submissionID = uuidv4();
  if (resetSession) {
    console.log(`Resetting to new submission ID`);
  }
  console.log(`Generating ${submissionID}`);
  cookie.submissionID = submissionID;
  console.log(
    `Creating Submission record in database for ${submissionID} and agency ${urlId}`
  );
  try {
    await upsertSubmission(submissionID, urlId);
  } catch (e) {
    console.error(`Database error! ${JSON.stringify(e)}`);
    throw redirect("/error/databaseError");
  }
  if (forceRedirect) {
    const redirectTarget = await validRoute(request, params, true);
    if (redirectTarget) {
      console.log(
        `Force redirect is ${forceRedirect.toString()}; sending the user back to ${redirectTarget}`
      );
      throw redirect(redirectTarget, {
        headers: {
          "Set-cookie": await ParticipantCookie.serialize(cookie),
        },
      });
    }
  }
  return {
    submissionID: submissionID,
    headers: {
      "Set-cookie": await ParticipantCookie.serialize(cookie),
    },
  };
};
