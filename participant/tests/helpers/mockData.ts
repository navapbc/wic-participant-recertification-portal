import { v4 as uuidv4 } from "uuid";
import { LocalAgency, Submission } from "@prisma/client";
import invariant from "tiny-invariant";

type SubmissionWithAgencyNoNull = Submission & {
  localAgency: LocalAgency;
};

export function getLocalAgency() {
  return {
    localAgencyId: uuidv4(),
    urlId: "agency",
    name: "A WIC Agency",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as LocalAgency;
}

export function getCurrentSubmission(submissionId: string = uuidv4()) {
  const agency = getLocalAgency();
  return {
    submissionId: submissionId,
    localAgency: agency,
    localagencyId: agency.localAgencyId,
    createdAt: new Date(),
    updatedAt: new Date(),
    submitted: false,
  } as unknown as SubmissionWithAgencyNoNull;
}

export function getExpiredSubmission(submissionId: string = uuidv4()) {
  const currentSubmission = getCurrentSubmission(submissionId);
  invariant(currentSubmission, "Did not get a current submission");
  let expired = new Date();
  expired.setHours(expired.getHours() - 2);
  currentSubmission.updatedAt = expired;
  return currentSubmission;
}
