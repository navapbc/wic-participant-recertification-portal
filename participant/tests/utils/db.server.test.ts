import { prismaMock } from "tests/helpers/prismaMock";
import {
  findSubmission,
  upsertSubmission,
  findLocalAgency,
} from "app/utils/db.server";
import { v4 as uuidv4 } from "uuid";

import { getLocalAgency, getCurrentSubmission } from "tests/helpers/mockData";

it("finds a submission", async () => {
  const submissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(submissionID);
  prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
  const foundSubmission = await findSubmission(submissionID);
  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(foundSubmission).toMatchObject(mockSubmission);
});

it("finds a localAgency", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const foundAgency = await findLocalAgency("agency");
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "agency" },
    })
  );
  expect(foundAgency).toMatchObject(mockAgency);
});

it("upserts a submission and looks up localagency", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const submissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(submissionID);
  prismaMock.submission.upsert.mockResolvedValue(mockSubmission);
  const upsertedSubmission = await upsertSubmission(submissionID, "agency");
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "agency" },
    })
  );
  // There is an updatedAt here.. but we'd have to do some fudging to
  // not run into race conditions for timestamp values
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
      create: {
        submissionId: submissionID,
        localAgencyId: mockAgency.localAgencyId,
      },
    })
  );
  expect(upsertedSubmission).toMatchObject(mockSubmission);
});

it("throws an exception if there is no agency", async () => {
  const submissionID = uuidv4();
  prismaMock.localAgency.findUnique.mockResolvedValue(null);
  await expect(async () => {
    await upsertSubmission(submissionID, "bogus");
  }).rejects.toThrow(`Unable to find agency for bogus`);
});
