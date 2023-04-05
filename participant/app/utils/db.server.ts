import db from "app/utils/db.connection";
import type { Prisma } from "@prisma/client";
import type { RouteType } from "app/types";
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

export const findSubmissionFormData = async (
  submissionID: string,
  formRoute: RouteType
) => {
  const submissionForm = await db.submissionForm.findFirst({
    where: {
      submissionId: submissionID,
      formRoute: formRoute,
    },
    select: {
      formData: true,
    },
  });
  return submissionForm?.formData;
};

export const upsertSubmissionForm = async (
  submissionID: string,
  formRoute: string,
  formData: any
) => {
  const submissionForm = await db.submissionForm.findFirst({
    where: {
      submissionId: submissionID,
      formRoute: formRoute,
    },
  });
  await db.submission.update({
    where: { submissionId: submissionID },
    data: { updatedAt: new Date() },
  });
  if (submissionForm) {
    return await db.submissionForm.update({
      where: {
        submissionFormId: submissionForm.submissionFormId,
      },
      data: {
        formData: formData,
        updatedAt: new Date(),
      },
    });
  }
  return await db.submissionForm.create({
    data: {
      submissionId: submissionID,
      formRoute: formRoute,
      formData: formData,
    },
  });
};

export const findLocalAgency = async (urlId: string) => {
  return await db.localAgency.findUnique({
    where: {
      urlId: urlId,
    },
  });
};

export const firstLocalAgency = async () => {
  return await db.localAgency.findFirst();
};
