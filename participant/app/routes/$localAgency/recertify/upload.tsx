import React, { useEffect, useRef, useState } from "react";

import { FileUploader } from "app/components/FileUploader";
import type {
  FileUploaderProps,
  FileUploaderRef,
} from "app/components/FileUploader";
import { Accordion, Alert, Button } from "@trussworks/react-uswds";
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
  unstable_composeUploadHandlers as composeUploadHandlers,
  redirect,
} from "@remix-run/server-runtime";
import type { UploadHandler, LoaderFunction } from "@remix-run/server-runtime";
import { Trans, useTranslation } from "react-i18next";

import { List } from "app/components/List";
import { cookieParser } from "app/cookies.server";
import {
  deleteDocument,
  fetchSubmissionData,
  findDocument,
  listDocuments,
  upsertDocument,
} from "app/utils/db.server";
import type { PreviousUpload, Proofs, SubmittedFile } from "app/types";
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
import type { TFunction } from "i18next";

const createPreviewData = async (
  submissionID: string
): Promise<PreviousUpload[]> => {
  const previousDocuments = await listDocuments(submissionID);
  const previousUploads = await Promise.all(
    previousDocuments.map(async (document) => {
      return {
        url: document.s3Url,
        name: document.originalFilename,
      } as PreviousUpload;
    })
  );
  return previousUploads;
};

export const createErrorElements = (
  rejectedFiles: SubmittedFile[],
  maxFileCount: number,
  maxFileSize: number,
  translation: TFunction<"translation", undefined, "translation">
) => {
  const erroredFilesStr =
    rejectedFiles
      .filter((e) => e.error != "fileCount")
      .map((file) => file.filename)
      .join(", ") || "";
  const fileCountError =
    rejectedFiles.some((e) => e.error === "fileCount") || false;
  const errorElements = [];
  if (rejectedFiles?.length == 0) {
    errorElements.push(
      <div key="filetype.empty">{translation("Upload.errors.empty")}</div>
    );
  }
  if (fileCountError) {
    errorElements.push(
      <span key="filecount.error">
        {translation("Upload.errors.fileCount", { maxFileLimit: maxFileCount })}
      </span>
    );
  }
  if (erroredFilesStr) {
    errorElements.push(
      <div key="filetype.error">
        {translation("Upload.errors.otherFileError", {
          disallowedFileNames: erroredFilesStr,
          sizeLimit: Math.floor(maxFileSize / 1024 / 1024).toString(),
        })}
      </div>
    );
  }
  if (errorElements) {
    return (
      <Alert
        slim={true}
        noIcon={false}
        validation={true}
        type="error"
        headingLevel="h3"
      >
        {errorElements}
      </Alert>
    );
  }
  return;
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
  const removeFile = url.searchParams.get("remove");
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
  const existingSubmissionData = await fetchSubmissionData(submissionID);
  if (!existingSubmissionData.changes) {
    const returnToChanges = routeRelative(request, "changes");
    console.log(`No changes data; returning to ${returnToChanges}`);
    return redirect(returnToChanges);
  }
  const proofRequired = determineProof(existingSubmissionData);
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
  const s3UploadHandler: UploadHandler = async ({ name, filename, data }) => {
    /* UploadHandlers can only return File | string | undefined..
     * So using JSON to serialize the data into a string is a hacktastic
     * workaround.
     */
    if (name !== "documents" || !filename) {
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
  const uploadHandler: UploadHandler = composeUploadHandlers(s3UploadHandler);
  const formData = await parseMultipartFormData(request, uploadHandler);
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
    console.log(
      `❌ Received ${totalUploads} files; max is ${MAX_UPLOAD_FILECOUNT}`
    );
    const newRejectedDocuments = await Promise.all(
      acceptedDocuments.map(async (fileToDelete) => {
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
    acceptedDocuments = acceptedDocuments.filter(({ filename }) => {
      return !rejectedDocuments.some((e) => e.filename === filename);
    });
  }
  console.log(
    `Accepted ${JSON.stringify(acceptedDocuments)}, Rejected ${JSON.stringify(
      rejectedDocuments
    )} from form`
  );
  acceptedDocuments.map(async (acceptedFile) => {
    // Create a presigned URL with expiration time and save to the database.
    const url = await getURLFromS3(acceptedFile.key!);
    await upsertDocument(submissionID, { ...acceptedFile!, s3Url: url });
  });
  if (!rejectedDocuments.length) {
    if (acceptedDocuments.length) {
      throw redirect(routeRelative(request, "contact"));
    } else {
      const previousUploads = await listDocuments(submissionID);
      if (previousUploads.length) {
        throw redirect(routeRelative(request, "contact"));
      }
    }
  }
  return {
    acceptedUploads: await createPreviewData(submissionID),
    rejectedUploads: rejectedDocuments,
  };
};

const buildDocumentHelp = (proofRequired: Proofs[]) => {
  const shouldNumber = proofRequired.length > 1;
  return proofRequired.sort().map((value, index) => {
    if (proofRequired.includes(value)) {
      return (
        <div key={`${value}-instructions`}>
          <h2>
            {shouldNumber && `${index + 1}.  `}
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
  const [previousUploadedFiles, setPreviouslyUploadedFiles] =
    useState<PreviousUpload[]>(previousUploads);
  const [serverError, setServerError] = useState(<></>);
  const [previousUploadPreviews, setPreviousUploadPreviews] = useState(<></>);
  const removeClick = (filename: string) => {
    const currentUploads = previousUploadedFiles;
    setPreviouslyUploadedFiles(
      currentUploads.filter((file) => file.name != filename)
    );
  };
  const renderPreviews = () => {
    const previousDocumentHeader = previousUploadedFiles.length ? (
      <h2 className="margin-top-2 font-sans">Previously uploaded documents</h2>
    ) : (
      <></>
    );
    setPreviousUploadPreviews(
      <>
        {previousDocumentHeader}
        <input type="hidden" name="action" value="remove_file" />
        {previousUploadedFiles.map(
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
                  clickHandler={() => removeClick(previousUpload.name)}
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
    if (fileInputRef?.current) {
      const removeDocuments: PreviousUpload[] = previousUploadedFiles;
      actionData?.rejectedUploads
        .filter((upload: SubmittedFile) => upload.error != "fileCount")
        ?.forEach((rejected) => {
          removeDocuments.push({
            url: "",
            name: rejected.filename,
          } as PreviousUpload);
        });
      if (removeDocuments) {
        fileInputRef.current.removeFileList(removeDocuments);
      }
    }
    if (actionData?.rejectedUploads) {
      const serverErrorElements = createErrorElements(
        actionData.rejectedUploads,
        maxFileCount,
        maxFileSize,
        t
      );
      if (serverErrorElements) {
        setServerError(serverErrorElements);
      }
    }
    // eslint-disable-next-line   react-hooks/exhaustive-deps -- (deps list is correct, adding renderPreviews is circular)
  }, [previousUploadedFiles, actionData]);

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
    // Chrome throws an error if the form is empty
    if (!data.has("documents")) {
      data.append("documents", "");
    }
    formSubmit(data, {
      method: "post",
      encType: "multipart/form-data",
      action: location.pathname,
    });
  };
  return (
    <div>
      <h1>{t("Upload.title")}</h1>
      <p>{t("Upload.intro")}</p>
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
            <h2 className="font-sans">
              <Trans i18nKey="FileUploader.label" />
            </h2>
            <div className="usa-hint">
              <Trans i18nKey="FileUploader.filetypehint" />
            </div>
            <Accordion
              className="margin-top-1"
              bordered={true}
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
            {serverError}
          </div>
        </FileUploader>
        <Button type="submit" value="submit" name="action">
          {t("Upload.button")}
        </Button>
      </Form>
    </div>
  );
}
