import { v4 as uuidv4 } from "uuid";
import type { LocalAgency, Submission } from "@prisma/client";
import invariant from "tiny-invariant";
import { readFileSync } from "fs";
type SubmissionWithAgencyNoNull = Submission & {
  localAgency: LocalAgency;
};

export function getTestImage(fileName: string): File {
  const data = readFileSync(
    "tests/fixtures/fns-stock-produce-shopper.jpg",
    "utf8"
  );
  return new File([data], fileName);
}

export function getLocalAgency(urlId: string = "agency") {
  return {
    localAgencyId: uuidv4(),
    urlId: urlId,
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
