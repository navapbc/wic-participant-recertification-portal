import db from "app/utils/db.connection";
import type { Prisma } from "@prisma/client";
import type { RouteType, SubmittedFile } from "app/types";
export type SubmissionWithAgency = Prisma.PromiseReturnType<
  typeof findSubmission
>;

export const findDocument = async (submissionID: string, filename: string) => {
  const document = await db.document.findFirst({
    where: {
      submissionId: submissionID,
      originalFilename: filename,
    },
  });
  return document;
};

export const deleteDocument = async (
  submissionID: string,
  filename: string
) => {
  const document = await findDocument(submissionID, filename);
  if (document) {
    await db.document.delete({
      where: {
        documentId: document.documentId,
      },
    });
  }
};

export const upsertDocument = async (
  submissionID: string,
  submittedFile: SubmittedFile
) => {
  const existingDocument = await findDocument(
    submissionID,
    submittedFile.filename
  );
  if (existingDocument) {
    return await db.document.update({
      where: {
        documentId: existingDocument.documentId,
      },
      data: {
        updatedAt: new Date(),
        s3Key: submittedFile.key,
        detectedFiletype: submittedFile.mimeType,
        detectedFilesizeBytes: submittedFile.size,
      },
    });
  }
  return await db.document.create({
    data: {
      submissionId: submissionID,
      s3Key: submittedFile.key || "",
      detectedFiletype: submittedFile.mimeType,
      detectedFilesizeBytes: submittedFile.size,
      originalFilename: submittedFile.filename,
    },
  });
};

export const listDocuments = async (submissionID: string) => {
  return await db.document.findMany({
    where: { submissionId: submissionID },
    select: {
      s3Key: true,
      originalFilename: true,
    },
  });
};

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
