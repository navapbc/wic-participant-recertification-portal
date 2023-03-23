/**
 * @jest-environment node
 */
/* eslint-disable jest/no-conditional-expect */

import {
  ParticipantCookie,
  cookieParser,
  sessionCheck,
} from "app/cookies.server";
import { v4 as uuidv4 } from "uuid";
import { prismaMock } from "tests/helpers/prismaMock";
import {
  getCurrentSubmission,
  getExpiredSubmission,
  getLocalAgency,
} from "tests/helpers/mockData";

async function makeCookieRequest(submissionID: string) {
  const cookieValue = await ParticipantCookie.serialize({
    submissionID: submissionID,
  });
  return {
    headers: new Map([["Cookie", cookieValue]]),
    url: "http://localhost/foobar",
  } as unknown as Request;
}

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

it("creates a session if it creates a new cookie", async () => {
  const request = { headers: new Map() } as unknown as Request;
  prismaMock.localAgency.findUnique.mockResolvedValue(
    getLocalAgency("gallatin")
  );
  const { submissionID, headers } = await cookieParser(request);
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(headers).toHaveProperty("Set-cookie");
});

it("creates a session if an empty cookie is sent", async () => {
  const request = { headers: new Map([["Cookie", ""]]) } as unknown as Request;
  prismaMock.localAgency.findUnique.mockResolvedValue(
    getLocalAgency("gallatin")
  );
  const { submissionID, headers } = await cookieParser(request);
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(headers).toHaveProperty("Set-cookie");
});

it("creates a session if a cookie with empty string SubmissionID is sent", async () => {
  const cookieRequest = await makeCookieRequest("");

  prismaMock.localAgency.findUnique.mockResolvedValue(
    getLocalAgency("gallatin")
  );
  const { submissionID, headers } = await cookieParser(cookieRequest);
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(headers).toHaveProperty("Set-cookie");
});

it("resets the session if a cookie is sent without DB Submission record", async () => {
  const submissionID = uuidv4();
  const cookieRequest = await makeCookieRequest(submissionID);

  prismaMock.submission.findUnique.mockResolvedValue(null);
  prismaMock.localAgency.findUnique.mockResolvedValue(
    getLocalAgency("gallatin")
  );
  let returnedSubmissionID: string = "default";
  try {
    await cookieParser(cookieRequest);
  } catch (error) {
    if (!(error instanceof Response)) throw error;
    expect(error.status).toBe(302);
    expect(error.headers.get("location")).toBe("/gallatin/recertify");
    expect(error.headers.get("set-cookie")).toContain(
      "prp-recertification-form"
    );
    // The headers on this redirect set the new cookie;
    // we need the value to verify the Database calls
    const returnedCookie = await ParticipantCookie.parse(
      error.headers.get("set-cookie")
    );
    returnedSubmissionID = returnedCookie.submissionID;
  }

  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
      },
    })
  );
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: returnedSubmissionID },
    })
  );
  expect(returnedSubmissionID).not.toBe(submissionID);
});

it("resets the session if asked to", async () => {
  const mockSubmissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(mockSubmissionID);
  prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
  const cookieRequest = await makeCookieRequest(mockSubmissionID);
  prismaMock.localAgency.findUnique.mockResolvedValue(
    getLocalAgency("gallatin")
  );
  let returnedSubmissionID: string = "default";
  try {
    await cookieParser(cookieRequest, {}, true);
  } catch (error) {
    if (!(error instanceof Response)) throw error;
    expect(error.status).toBe(302);
    expect(error.headers.get("location")).toBe("/gallatin/recertify");
    expect(error.headers.get("set-cookie")).toContain(
      "prp-recertification-form"
    );
    // The headers on this redirect set the new cookie;
    // we need the value to verify the Database calls
    const returnedCookie = await ParticipantCookie.parse(
      error.headers.get("set-cookie")
    );
    returnedSubmissionID = returnedCookie.submissionID;
  }

  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: mockSubmissionID,
      },
    })
  );
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: returnedSubmissionID },
    })
  );
  expect(returnedSubmissionID).not.toBe(mockSubmissionID);
});

it("continues the same session if valid", async () => {
  const mockSubmissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(mockSubmissionID);
  prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
  const cookieRequest = await makeCookieRequest(mockSubmissionID);

  const { submissionID, headers } = await cookieParser(cookieRequest);

  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
      },
    })
  );
  // The cookie parser doesn't do upserts on valid sessions
  expect(prismaMock.submission.upsert).not.toHaveBeenCalled();
  // The cookie parser doesn't set a new cookie on a valid session
  expect(headers).toBeUndefined;
  // It does return the same SubmissionID for the loader / caller to use
  expect(submissionID).toEqual(mockSubmissionID);
});

it("resets the session if the submission is stale", async () => {
  const mockSubmissionID = uuidv4();
  const cookieRequest = await makeCookieRequest(mockSubmissionID);
  const mockSubmission = getExpiredSubmission(mockSubmissionID);
  const mockAgency = getLocalAgency("gallatin");
  prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);

  let returnedSubmissionID: string = "default";
  try {
    await cookieParser(cookieRequest);
  } catch (error) {
    if (!(error instanceof Response)) throw error;
    expect(error.status).toBe(302);
    expect(error.headers.get("location")).toBe("/gallatin/recertify");
    expect(error.headers.get("set-cookie")).toContain(
      "prp-recertification-form"
    );
    // The headers on this redirect set the new cookie;
    // we need the value to verify the Database calls
    const returnedCookie = await ParticipantCookie.parse(
      error.headers.get("set-cookie")
    );
    returnedSubmissionID = returnedCookie.submissionID;
  }

  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: mockSubmissionID,
      },
    })
  );
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: returnedSubmissionID },
      create: {
        submissionId: returnedSubmissionID,
        localAgencyId: mockAgency.localAgencyId,
      },
    })
  );
  expect(returnedSubmissionID).not.toBe(mockSubmissionID);
});
