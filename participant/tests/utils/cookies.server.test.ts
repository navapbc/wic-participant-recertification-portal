import {
  ParticipantCookie,
  cookieParser,
  sessionCheck,
} from "app/cookies.server";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "@remix-run/node";
import { prismaMock } from "tests/helpers/prismaMock";
import {
  getCurrentSubmission,
  getExpiredSubmission,
} from "tests/helpers/mockData";

it("tests the session as FRESH", () => {
  const freshSubmission = getCurrentSubmission();
  const freshness = sessionCheck(freshSubmission.updatedAt);
  expect(freshness).toBe(true);
});

it("tests a stale session as not fresh", () => {
  const staleSubmission = getExpiredSubmission();
  const freshness = sessionCheck(staleSubmission.updatedAt);
  expect(freshness).toBe(false);
});

it("it creates a session if it creates a new cookie", async () => {
  const request = { headers: {} } as Request;
  const { submissionID, headers } = await cookieParser(request);
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(headers).toHaveProperty("Set-cookie");
});
