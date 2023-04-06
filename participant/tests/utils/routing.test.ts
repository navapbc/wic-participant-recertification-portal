import { routeRelative, routeFromChanges } from "~/utils/routing";
const baseRequest = {
  url: "http://localhost:3000/gallatin/recertify/somewhere",
} as Request;

it("generates a relative URL", () => {
  const targetUrl = routeRelative(baseRequest, "elsewhere");
  expect(targetUrl).toBe("/gallatin/recertify/elsewhere");
});

const changes = [
  { idChange: "yes", addressChange: "no" },
  { idChange: "no", addressChange: "yes" },
  { idChange: "yes", addressChange: "yes" },
];

it.each(changes)("routes to upload if there are changes: %s", (change) => {
  const targetUrl = routeFromChanges(baseRequest, change);
  expect(targetUrl).toBe("/gallatin/recertify/upload");
});

it("does not route to /upload if there are no changes", () => {
  const noChanges = { idChange: "no", addressChange: "no" };
  const targetUrl = routeFromChanges(baseRequest, noChanges);
  expect(targetUrl).not.toBe("/gallatin/recertify/upload");
});
