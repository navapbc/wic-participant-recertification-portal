import db from "app/utils/db.connection";
import type { Prisma } from "@prisma/client";

export type SubmissionWithAgency = Prisma.PromiseReturnType<
  typeof findSubmission
>;

export const findSubmission = async (submissionID: string) => {
  const submission = await db.submission.findUnique({
    where: {
      submissionId: submissionID,
    },
    include: {
      localAgency: true,
    },
  });
  return submission;
};

export const upsertSubmission = async (submissionID: string, urlId: string) => {
  const localAgency = await findLocalAgency(urlId);
  if (!localAgency) {
    throw Error(`Unable to find agency for ${urlId}`);
  }
  const existingSubmission = await db.submission.upsert({
    where: {
      submissionId: submissionID,
    },
    create: {
      submissionId: submissionID,
      localAgencyId: localAgency.localAgencyId,
    },
    update: {
      updatedAt: new Date(),
    },
  });
  return existingSubmission;
};

export const findLocalAgency = async (urlId: string) => {
  return await db.localAgency.findUnique({
    where: {
      urlId: urlId,
    },
  });
};
