// app/sessions.js
import { createCookie } from "@remix-run/node"; // or "@remix-run/cloudflare"
import type { Request } from "@remix-run/node";
import { redirect } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { findSubmission, upsertSubmission } from "./utils/db.server";

const MAX_SESSION_SECONDS = Number(process.env.MAX_SESSION_SECONDS) || 1800;

type ParticipantCookieContents = {
  submissionID?: string;
};

export const ParticipantCookie = createCookie("prp-recertification-form", {
  secure: true,
});

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

export const cookieParser = async (request: Request, resetSession = false) => {
  const cookie = ((await ParticipantCookie.parse(
    request.headers.get("Cookie")
  )) || {}) as ParticipantCookieContents;
  let forceRedirect: boolean = resetSession;
  const urlId = "gallatin"; // ONLY HERE until PRP-227
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
          console.log(`Session ${submissionID} valid; finished parser`);
          return { submissionID: submissionID, headers: {} };
        }
        forceRedirect = true;
      }
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
  await upsertSubmission(submissionID, urlId);
  if (forceRedirect) {
    console.log(
      `Force redirect is ${forceRedirect.toString()}; sending the user back to /`
    );
    throw redirect("/", {
      headers: {
        "Set-Cookie": await ParticipantCookie.serialize(cookie),
      },
    });
  }
  return {
    submissionID: submissionID,
    headers: {
      "Set-cookie": await ParticipantCookie.serialize(cookie),
    },
  };
};
