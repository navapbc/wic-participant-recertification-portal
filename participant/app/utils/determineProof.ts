import type { ChangesData, Proofs } from "~/types";

export const determineProof = (changes: ChangesData): Proofs[] => {
  let requiredProofs: Proofs[] = [];
  if (changes.addressChange == "yes") {
    requiredProofs.push("address");
  }
  if (changes.idChange == "yes") {
    requiredProofs.push("identity");
  }
  return requiredProofs;
};
