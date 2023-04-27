import type { Proofs, SubmissionData } from "~/types";

export const determineProof = (submission: SubmissionData): Proofs[] => {
  let requiredProofs: Proofs[] = [];
  if (submission.changes?.addressChange == "yes") {
    requiredProofs.push("address");
  }
  if (submission.changes?.idChange == "yes") {
    requiredProofs.push("identity");
  }
  if (submission.participant?.some((person) => person.adjunctive === "no")) {
    requiredProofs.push("income");
  }
  return requiredProofs;
};
