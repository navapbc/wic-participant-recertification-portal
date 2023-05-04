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
import { json, redirect } from "@remix-run/server-runtime";
import type { LoaderFunction } from "@remix-run/server-runtime";
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
import { checkRoute, routeRelative } from "app/utils/routing";
import { getURLFromS3, checkFile, deleteFileFromS3 } from "app/utils/s3.server";
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
  const putFileAction = url.searchParams.get("action") == "put_file";
  const removeFile = url.searchParams.get("remove");
  const putFile = url.searchParams.get("put");
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
  if (putFileAction && putFile) {
    const existingUploads = await listDocuments(submissionID);
    if (existingUploads.length + 1 > MAX_UPLOAD_FILECOUNT) {
      console.log(`Too many files: have ${existingUploads.length}`);
      return json({ error: "fileCount" });
    }
    const s3key = `${submissionID}/${putFile}`;
    const getURL = await getURLFromS3(s3key);
    await upsertDocument(submissionID, {
      key: s3key,
      filename: putFile,
      accepted: true,
      s3Url: getURL,
    });
    const putURL = await getURLFromS3(`${submissionID}/${putFile}`, "PUT");
    console.log(`🔼 Created PUT URL for ${putFile}: ${putURL}`);
    return json({
      putFileURL: putURL,
    });
  }
  const existingSubmissionData = await fetchSubmissionData(submissionID);
  checkRoute(request, existingSubmissionData);
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
      origin:
        request.headers.get("x-forwarded-proto") === "https"
          ? url.origin.replace("http", "https")
          : url.origin,
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
  const acceptedDocuments: SubmittedFile[] = [];
  const rejectedDocuments: SubmittedFile[] = [];
  // All documents are previously uploaded documents now 🙃
  const previousUploads = await listDocuments(submissionID);

  await Promise.all(
    previousUploads.map(async (document) => {
      const { mimeType, error, size } = await checkFile(document.s3Key);
      console.log(
        `Checking ${document.originalFilename} mime ${mimeType} size ${size} error ${error}`
      );
      if (error) {
        console.log(
          `❌ Rejected file ${document.originalFilename} - mimeType: ${mimeType} error: ${error}`
        );
        await deleteFileFromS3(document.s3Key);
        await deleteDocument(submissionID, document.originalFilename);
        console.log(`🗑️  Deleted ${document.originalFilename} from S3 and DB`);
        rejectedDocuments.push({
          filename: document.originalFilename,
          accepted: false,
          error: error,
          size: size,
          mimeType: mimeType,
        });
      } else {
        const acceptedDocument = {
          filename: document.originalFilename,
          accepted: true,
          key: document.s3Key,
          size: size,
          mimeType: mimeType,
        };
        // This is to update the server validated mimetype and size
        await upsertDocument(submissionID, acceptedDocument);
        acceptedDocuments.push(acceptedDocument);
      }
    })
  );
  console.log(
    `Accepted ${JSON.stringify(acceptedDocuments)} Rejected ${JSON.stringify(
      rejectedDocuments
    )}`
  );
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
    acceptedUploads: acceptedDocuments.map(async (document) => {
      return {
        url: document.s3Url,
        name: document.filename,
      } as PreviousUpload;
    }),
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
  const { proofRequired, maxFileSize, maxFileCount, previousUploads, origin } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const formSubmit = useSubmit();
  const [previousUploadedFiles, setPreviouslyUploadedFiles] =
    useState<PreviousUpload[]>(previousUploads);
  const [serverError, setServerError] = useState(<></>);
  const [previousUploadPreviews, setPreviousUploadPreviews] = useState(<></>);
  const removeClick = async (filename: string) => {
    await removeFileHook(filename);
    const currentUploads = previousUploadedFiles;
    setPreviouslyUploadedFiles(
      currentUploads.filter((file) => file.name != filename)
    );
  };
  const removeFileHook = async (filename: string) => {
    const removeURL = new URL(`${origin}${location.pathname}`);
    removeURL.searchParams.set("action", "remove_file");
    removeURL.searchParams.set("remove", filename);
    removeURL.searchParams.set("_data", "routes/$localAgency/recertify/upload");
    await fetch(removeURL);
  };
  const addFileHook = async (file: File) => {
    console.log(`Trying to get URL for ${file.name}`);
    // Needs a real URL, filename neeeds urlescaping
    const addURL = new URL(`${origin}${location.pathname}`);
    addURL.searchParams.set("action", "put_file");
    addURL.searchParams.set("put", file.name);
    addURL.searchParams.set("_data", "routes/$localAgency/recertify/upload");
    const getResponse = await fetch(addURL);
    const getURL = await getResponse.json();
    if (getURL.error) {
      return getURL.error;
    }
    console.log(`Starting upload of ${file.name} to ${getURL.putFileURL}`);
    await fetch(getURL.putFileURL, {
      body: file,
      method: "PUT",
      headers: { "content-type": file.type },
    });
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
                  buttonType="button"
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
    addFileHook: addFileHook,
    removeFileHook: removeFileHook,
  };
  const documentProofElements = buildDocumentHelp(proofRequired);

  const fileInputRef = useRef<FileUploaderRef>(null);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let data = new FormData(event.currentTarget);
    // No empty files from the real component sneaking in
    data.delete("documents");
    fileInputRef.current?.files.forEach((value) => {
      data.append("documents", value.name);
    });
    // Chrome throws an error if the form is empty
    if (!data.has("documents")) {
      data.append("documents", "");
    }
    formSubmit(data, {
      method: "post",
      action: location.pathname,
    });
  };
  return (
    <div>
      <h1>{t("Upload.title")}</h1>
      <p>{t("Upload.intro")}</p>
      {documentProofElements}
      {previousUploadPreviews}
      <Form
        method="post"
        id="uploadForm"
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
