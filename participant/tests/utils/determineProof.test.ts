import { determineProof } from "app/utils/determineProof";

it("should return no proof if changes are all NO", () => {
  const proofs = determineProof({ idChange: "no", addressChange: "no" });
  expect(proofs).toEqual([]);
});

it("should return address proof if address changes", () => {
  const proofs = determineProof({ idChange: "no", addressChange: "yes" });
  expect(proofs).toEqual(["address"]);
});

it("should return identity proof if id changes", () => {
  const proofs = determineProof({ idChange: "yes", addressChange: "no" });
  expect(proofs).toEqual(["identity"]);
});

it("should return identity and address proofs if id and address change", () => {
  const proofs = determineProof({ idChange: "yes", addressChange: "yes" });
  expect(proofs).toEqual(["address", "identity"]);
});
