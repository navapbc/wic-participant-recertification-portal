import React, { useEffect, useRef, useState } from "react";

import { FileUploader } from "app/components/FileUploader";
import type {
  FileUploaderProps,
  FileUploaderRef,
} from "app/components/FileUploader";
import { Accordion, Button } from "@trussworks/react-uswds";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useSubmit,
} from "@remix-run/react";
import type { Params } from "@remix-run/react";
import {
  json,
  unstable_parseMultipartFormData as parseMultipartFormData,
  redirect,
} from "@remix-run/server-runtime";
import type { UploadHandler, LoaderFunction } from "@remix-run/server-runtime";
import { Trans, useTranslation } from "react-i18next";

import { List } from "app/components/List";
import { cookieParser } from "app/cookies.server";
import {
  deleteDocument,
  findDocument,
  findSubmissionFormData,
  listDocuments,
  upsertDocument,
} from "app/utils/db.server";
import type {
  ChangesData,
  PreviousUpload,
  Proofs,
  SubmittedFile,
} from "app/types";
import { determineProof } from "app/utils/determineProof";
import { routeRelative } from "app/utils/routing";
import {
  uploadStreamToS3,
  getURLFromS3,
  checkFile,
  deleteFileFromS3,
} from "app/utils/s3.server";
import {
  MAX_UPLOAD_FILECOUNT,
  MAX_UPLOAD_SIZE_BYTES,
} from "app/utils/config.server";
import { FilePreview } from "~/components/FilePreview";

const createPreviewData = async (
  submissionID: string
): Promise<PreviousUpload[]> => {
  const previousDocuments = await listDocuments(submissionID);
  const previousUploads = await Promise.all(
    previousDocuments.map(async (document) => {
      const downloadUrl = await getURLFromS3(document.s3Key);
      return {
        url: downloadUrl,
        name: document.originalFilename,
      } as PreviousUpload;
    })
  );
  return previousUploads;
};

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const url = new URL(request.url);
  const removeFileAction = url.searchParams.get("action") == "remove_file";
  const removeFile = url.searchParams.get("remove_file");
  if (removeFileAction && removeFile) {
    console.log(`⏳ Received request to remove ${removeFile}`);
    const existingRecord = await findDocument(submissionID, removeFile);
    if (existingRecord) {
      await deleteFileFromS3(existingRecord.s3Key);
      await deleteDocument(submissionID, existingRecord.originalFilename);
      console.log(
        `🗑️  Deleted ${existingRecord.originalFilename} from S3 and DB`
      );
    } else {
      console.log(`⚠️  Could not find ${removeFile}`);
    }
    // This prevents a remove command from being in the history
    return redirect(routeRelative(request, "/upload"));
  }
  const existingChangesData = (await findSubmissionFormData(
    submissionID,
    "changes"
  )) as ChangesData;
  if (!existingChangesData) {
    const returnToChanges = routeRelative(request, "changes");
    console.log(`No changes data; returning to ${returnToChanges}`);
    return redirect(returnToChanges);
  }
  const proofRequired = determineProof(existingChangesData);
  if (proofRequired.length == 0) {
    const skipToContact = routeRelative(request, "contact");
    console.log(`No proof required; routing to ${skipToContact}`);
    return redirect(skipToContact);
  }
  const previousUploads = await createPreviewData(submissionID);
  return json(
    {
      submissionID: submissionID,
      proofRequired: proofRequired,
      maxFileCount: MAX_UPLOAD_FILECOUNT,
      maxFileSize: MAX_UPLOAD_SIZE_BYTES,
      previousUploads: previousUploads,
    },
    { headers: headers }
  );
};

export const action = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID } = await cookieParser(request, params);
  const uploadHandler: UploadHandler = async ({ name, filename, data }) => {
    /* UploadHandlers can only return File | string | undefined..
     * So using JSON to serialize the data into a string is a hacktastic
     * workaround. The other clear option is to
     */
    if (name !== "documents") {
      return;
    }
    const uploadKey = [submissionID, filename!].join("/");
    const fileLocation = await uploadStreamToS3(data, uploadKey);
    const { mimeType, error, size } = await checkFile(uploadKey);
    if (error) {
      console.log(
        `❌ Rejected file ${filename} - mimeType: ${mimeType} error: ${error}`
      );
      await deleteFileFromS3(uploadKey);
      return JSON.stringify({
        filename: filename!,
        accepted: false,
        error: error,
        size: size,
        mimeType: mimeType,
      } as SubmittedFile);
    }

    return JSON.stringify({
      filename: filename!,
      accepted: true,
      url: fileLocation,
      key: uploadKey,
      size: size,
      mimeType: mimeType,
    } as SubmittedFile);
  };

  const formData = await parseMultipartFormData(request, uploadHandler);
  // const submittedDocuments = formData.getAll("documents").map((value) => {
  //   if (typeof value == "string") {
  //     return JSON.parse(value) as SubmittedFile;
  //   }
  // });
  const submittedDocuments = formData
    .getAll("documents")
    .reduce<SubmittedFile[]>((parsedFileList, rawFile) => {
      if (typeof rawFile == "string") {
        parsedFileList.push(JSON.parse(rawFile) as SubmittedFile);
      }
      return parsedFileList;
    }, [] as SubmittedFile[]);
  let acceptedDocuments = submittedDocuments.filter((value) => {
    return value?.accepted == true;
  });
  const rejectedDocuments = submittedDocuments.filter((value) => {
    return value?.accepted == false;
  });
  const previousUploads = await listDocuments(submissionID);
  const totalUploads = previousUploads.length + acceptedDocuments.length;
  if (totalUploads > MAX_UPLOAD_FILECOUNT) {
    const availableUploads = MAX_UPLOAD_FILECOUNT - previousUploads.length;
    console.log(
      `❌ Received ${totalUploads} files; max is ${MAX_UPLOAD_FILECOUNT}`
    );
    const newRejectedDocuments = await Promise.all(
      acceptedDocuments.slice(availableUploads).map(async (fileToDelete) => {
        if (fileToDelete?.key) {
          await deleteFileFromS3(fileToDelete.key);
        }
        return {
          accepted: false,
          filename: fileToDelete!.filename,
          error: "fileCount",
          size: fileToDelete!?.size,
        } as SubmittedFile;
      })
    );
    rejectedDocuments.push.apply(rejectedDocuments, newRejectedDocuments);
    formData.delete("documents");
    acceptedDocuments = acceptedDocuments.slice(0, availableUploads);
  }
  console.log(
    `Accepted ${JSON.stringify(acceptedDocuments)}, Rejected ${JSON.stringify(
      rejectedDocuments
    )} from form`
  );
  acceptedDocuments.map(async (acceptedFile) => {
    await upsertDocument(submissionID, acceptedFile!);
  });
  if (!rejectedDocuments.length) {
    if (acceptedDocuments.length) {
      throw redirect(routeRelative(request, "/contact"));
    } else {
      const previousUploads = await listDocuments(submissionID);
      if (previousUploads.length) {
        throw redirect(routeRelative(request, "/contact"));
      }
    }
  }
  return {
    acceptedUploads: await createPreviewData(submissionID),
    rejectedUploads: rejectedDocuments,
  };
};

const buildDocumentHelp = (proofRequired: Proofs[]) => {
  const allProofs: Proofs[] = ["address", "identity", "income"];
  return allProofs.map((value) => {
    if (proofRequired.includes(value)) {
      return (
        <div key={`${value}-instructions`}>
          <h2>
            <Trans i18nKey={`Upload.${value}.label`} key={`${value}-label`} />
          </h2>
          <div>
            <Trans
              i18nKey={`Upload.${value}.heading`}
              key={`${value}-heading`}
            />
          </div>
          <List
            i18nKey={`Upload.${value}.examples`}
            key={`${value}-examples`}
            type="unordered"
          />
        </div>
      );
    }
    return "";
  });
};

export default function Upload() {
  const { t } = useTranslation();
  const location = useLocation();
  const { proofRequired, maxFileSize, maxFileCount, previousUploads } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const formSubmit = useSubmit();

  const [previousUploadPreviews, setPreviousUploadPreviews] = useState(<></>);
  const removePreviousFile = (fileName: string) => {};
  const renderPreviews = () => {
    const previousDocumentHeader = previousUploads.length ? (
      <div className="margin-top-2 font-sans-lg">
        Previously Uploaded Documents
      </div>
    ) : (
      <></>
    );
    setPreviousUploadPreviews(
      <>
        {previousDocumentHeader}
        <input type="hidden" name="action" value="remove_file" />
        {previousUploads.map(
          (previousUpload: PreviousUpload, index: number) => {
            return (
              <div
                key={`preview-document-${index + 1}`}
                className="margin-top-2"
              >
                <FilePreview
                  imageId={`previous-preview-${index}`}
                  file={previousUpload.url}
                  name={previousUpload.name}
                  clickHandler={removePreviousFile}
                  buttonType="submit"
                  removeFileKey={
                    "Upload.previouslyuploaded.filepreview.removeFile"
                  }
                  selectedKey={"Upload.previouslyuploaded.filepreview.selected"}
                  altTextKey={"Upload.previouslyuploaded.filepreview.altText"}
                />
              </div>
            );
          }
        )}
      </>
    );
  };
  useEffect(() => {
    renderPreviews();
    // eslint-disable-next-line   react-hooks/exhaustive-deps -- (deps list is correct, adding renderPreviews is circular)
  }, [previousUploads]);

  const defaultProps: FileUploaderProps = {
    id: "file-input-documents",
    name: "documents",
    labelKey: "FileUploader",
    accept: "image/*,.pdf",
    maxFileCount: maxFileCount,
    maxFileSizeInBytes: maxFileSize,
  };
  const documentProofElements = buildDocumentHelp(proofRequired);

  const fileInputRef = useRef<FileUploaderRef>(null);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let data = new FormData(event.currentTarget);
    // No empty files from the real component sneaking in
    data.delete("documents");
    fileInputRef.current?.files.forEach((value) => {
      data.append("documents", value);
    });
    formSubmit(data, {
      method: "post",
      encType: "multipart/form-data",
      action: location.pathname,
    });
  };
  if (actionData?.acceptedUploads && fileInputRef?.current) {
    fileInputRef.current.removeFileList(actionData.acceptedUploads);
  }
  return (
    <div>
      <h1>{t("Upload.title")}</h1>
      {documentProofElements}
      <Form method="get" id="previousFiles" name="previous-uploads-form">
        {previousUploadPreviews}
      </Form>
      <Form
        method="post"
        id="uploadForm"
        encType="multipart/form-data"
        className="usa-form usa-form--large"
        name="documents-form"
        action={location.pathname}
        onSubmit={(event) => handleSubmit(event)}
      >
        <FileUploader {...defaultProps} ref={fileInputRef}>
          <div>
            <div className="font-sans-lg">
              <Trans i18nKey="FileUploader.label" />
            </div>
            <div className="usa-hint">
              <Trans i18nKey="FileUploader.filetypehint" />
            </div>
            <Accordion
              items={[
                {
                  title: <Trans i18nKey={"Upload.filetips.title"} />,
                  content: (
                    <div>
                      <span>
                        <Trans i18nKey="Upload.filetips.accepts.title" />
                      </span>
                      <List
                        i18nKey="Upload.filetips.accepts.items"
                        type="unordered"
                      />
                      <span>
                        <Trans i18nKey="Upload.filetips.format.title" />
                      </span>
                      <List
                        i18nKey="Upload.filetips.format.items"
                        type="unordered"
                      />
                      <span>
                        <Trans i18nKey="Upload.filetips.email.title" />
                      </span>
                      <List
                        i18nKey="Upload.filetips.email.items"
                        type="ordered"
                      />
                    </div>
                  ),
                  id: "upload-tips-accordion",
                  expanded: false,
                  headingLevel: "h3",
                },
              ]}
            />
          </div>
        </FileUploader>
        <Button type="submit" value="submit" name="action">
          Upload
        </Button>
      </Form>
    </div>
  );
}
