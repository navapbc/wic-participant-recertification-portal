import { determineProof } from "app/utils/determineProof";
import type { Participant } from "~/types";

const participantData = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Bamboozled",
  lastName: "Cheesemuffin",
  relationship: "grandchild",
};

it("should return no proof if changes are all NO and adjunctive is yes", () => {
  const proofs = determineProof({
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  });
  expect(proofs).toEqual([]);
});

it("should return address proof if address changes", () => {
  const proofs = determineProof({
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  });
  expect(proofs).toEqual(["address"]);
});

it("should return identity proof if id changes", () => {
  const proofs = determineProof({
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  });
  expect(proofs).toEqual(["identity"]);
});

it("should return identity and address proofs if id and address change", () => {
  const proofs = determineProof({
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  });
  expect(proofs).toEqual(["address", "identity"]);
});

it("should return income proof if a person has no adjunctive eligibility", () => {
  const proofs = determineProof({
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  });
  expect(proofs).toEqual(["income"]);
});

it("should return income proof if one person in a list has no adjunctive eligibility", () => {
  const proofs = determineProof({
    changes: { idChange: "no", addressChange: "no" },
    participant: [
      { ...participantData, adjunctive: "no" },
      { ...participantData, adjunctive: "yes" },
    ] as Participant[],
  });
  expect(proofs).toEqual(["income"]);
});

it("should return income proof and address proof if a person has no adjunctive eligibility and address changes", () => {
  const proofs = determineProof({
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  });
  expect(proofs).toEqual(["address", "income"]);
});

it("should return income proof and identity proof if a person has no adjunctive eligibility and identity changes", () => {
  const proofs = determineProof({
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  });
  expect(proofs).toEqual(["identity", "income"]);
});

it("should return ALL THE PROOFS if a person has no adjunctive eligibility and identity and address change", () => {
  const proofs = determineProof({
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  });
  expect(proofs).toEqual(["address", "identity", "income"]);
});
