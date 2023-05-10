import db from "app/utils/db.connection";
import type { Prisma } from "@prisma/client";
import type {
  ChangesData,
  ContactData,
  CountData,
  NameData,
  Participant,
  RouteType,
  SubmissionData,
  SubmittedFile,
} from "app/types";
import { S3_PRESIGNED_URL_RENEWAL_THRESHOLD } from "app/utils/config.server";
import { getSecondsAgo } from "app/utils/date";

export type SubmissionWithAgency = Prisma.PromiseReturnType<
  typeof findSubmission
>;

export type DocumentList = Prisma.PromiseReturnType<typeof listDocuments>;

export const upsertStaffUser = async (urlId: string, staffUserId: string) => {
  const localAgency = await findLocalAgency(urlId);
  if (!localAgency) {
    throw Error(`Unable to find agency for ${urlId}`);
  }
  const existingStaffUser = await db.staffUser.upsert({
    where: {
      staffUserId: staffUserId,
    },
    create: {
      staffUserId: staffUserId,
      localAgencyId: localAgency.localAgencyId,
    },
    update: {
      localAgencyId: localAgency.localAgencyId,
      updatedAt: new Date(),
    },
  });
  return existingStaffUser;
};

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
        s3Url: submittedFile.s3Url,
        detectedFiletype: submittedFile.mimeType,
        detectedFilesizeBytes: submittedFile.size,
      },
    });
  }
  return await db.document.create({
    data: {
      submissionId: submissionID,
      s3Key: submittedFile.key || "",
      s3Url: submittedFile.s3Url || "",
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
      s3Url: true,
      originalFilename: true,
    },
  });
};

export const listExpiringDocuments = async () => {
  return await db.document.findMany({
    where: {
      updatedAt: {
        lt: getSecondsAgo(S3_PRESIGNED_URL_RENEWAL_THRESHOLD),
      },
    },
    select: {
      submissionId: true,
      originalFilename: true,
      s3Key: true,
      updatedAt: true,
    },
  });
};

export const updateDocumentS3Url = async (
  submissionID: string,
  filename: string,
  s3Url: string
) => {
  const existingDocument = await findDocument(submissionID, filename);
  if (!existingDocument) {
    throw Error(`Unable to find document for ${submissionID} ${filename}`);
  }
  return await db.document.update({
    where: {
      documentId: existingDocument.documentId,
    },
    data: {
      updatedAt: new Date(),
      s3Url: s3Url,
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

export const upsertSubmission = async (
  submissionID: string,
  urlId: string,
  submitted?: boolean
) => {
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
      submitted: submitted,
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

export const upsertLocalAgency = async (urlId: string, name: string) => {
  const existingLocalAgency = await db.localAgency.upsert({
    where: {
      urlId: urlId,
    },
    create: {
      urlId: urlId,
      name: name,
    },
    update: {
      name: name,
      updatedAt: new Date(),
    },
  });
  return existingLocalAgency;
};

export const firstLocalAgency = async () => {
  return await db.localAgency.findFirst();
};

export const fetchSubmissionData = async (
  submissionID: string
): Promise<SubmissionData> => {
  const existingSubmissionPages = await db.submissionForm.findMany({
    where: {
      submissionId: submissionID,
    },
    select: {
      formRoute: true,
      formData: true,
    },
  });
  const mapped = new Map(
    existingSubmissionPages.map((obj) => [
      obj.formRoute,
      obj.formData as Prisma.JsonObject,
    ])
  );
  const documents = await listDocuments(submissionID);
  const submissionData: SubmissionData = {
    name: mapped.get("name") as NameData,
    changes: mapped.get("changes") as ChangesData,
    participant: mapped.get("details") as unknown as Participant[],
    contact: mapped.get("contact") as ContactData,
    count: mapped.get("count") as CountData,
    documents: documents,
  };
  return submissionData;
};
