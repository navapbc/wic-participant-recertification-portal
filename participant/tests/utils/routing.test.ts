/**
 * @jest-environment node
 */
import type { Participant } from "~/types";
import { routeRelative, routeFromChanges } from "~/utils/routing";
const baseRequest = {
  url: "http://localhost:3000/gallatin/recertify/somewhere",
} as Request;

it("generates a relative URL", () => {
  const targetUrl = routeRelative(baseRequest, "elsewhere");
  expect(targetUrl).toBe("/gallatin/recertify/elsewhere");
});

const participantData = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Bamboozled",
  lastName: "Cheesemuffin",
  relationship: "grandchild",
};

const changes = [
  {
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
];

it.each(changes)(
  "routes to upload if there are changes or NO adjunctive eligibility: %s",
  (change) => {
    const targetUrl = routeFromChanges(baseRequest, change);
    expect(targetUrl).toBe("/gallatin/recertify/upload");
  }
);

it("does not route to /upload if there are no changes and adjunctive eligibility", () => {
  const noChangesAndAdjunctive = {
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  };
  const targetUrl = routeFromChanges(baseRequest, noChangesAndAdjunctive);
  expect(targetUrl).toBe("/gallatin/recertify/contact");
});
