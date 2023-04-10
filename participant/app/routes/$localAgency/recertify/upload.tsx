import React, { useRef } from "react";

import { FileUploader } from "app/components/FileUploader";
import type {
  FileUploaderProps,
  FileInputRef,
} from "app/components/FileUploader";
import { Accordion, Button } from "@trussworks/react-uswds";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
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
import { findSubmissionFormData } from "app/utils/db.server";
import type { ChangesData, Proofs } from "app/types";
import { determineProof } from "app/utils/determineProof";
import { routeRelative } from "app/utils/routing";
import { uploadStreamToS3, getURLFromS3 } from "app/utils/s3.server";

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
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
  return json(
    {
      submissionID: submissionID,
      proofRequired: proofRequired,
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const uploadHandler: UploadHandler = async ({
    name,
    filename,
    contentType,
    data,
  }) => {
    if (name !== "documents") {
      return;
    }
    console.log(
      `NAME ${name} FILENAME ${filename} CONTENT TYPE ${contentType}`
    );
    const fileLocation = await uploadStreamToS3(data, filename!);
    console.log(`FILENAME ${filename} uploaded to ${fileLocation}`);
    return fileLocation;
  };

  const formData = await parseMultipartFormData(request, uploadHandler);

  console.log(
    `Received ${JSON.stringify(formData.getAll("documents"))} from form`
  );
  return null;
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
  const { proofRequired } = useLoaderData<loaderData>();
  const defaultProps: FileUploaderProps = {
    id: "file-input-documents",
    name: "documents",
    labelKey: "FileUploader",
    accept: "image/*,.pdf",
    maxFileCount: 20,
    maxFileSizeInBytes: 5_242_880,
  };
  const documentProofElements = buildDocumentHelp(proofRequired);

  const fileInputRef = useRef<FileInputRef>(null);
  const formSubmit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let data = new FormData(event.currentTarget);
    // No empty files from the real component sneaking in
    data.delete("documents");
    fileInputRef.current?.files.forEach((value) => {
      data.append("documents", value);
    });
    formSubmit(data, { method: "post", encType: "multipart/form-data" });
  };
  return (
    <div>
      <h1>{t("Upload.title")}</h1>
      {documentProofElements}
      <Form
        method="post"
        id="uploadForm"
        encType="multipart/form-data"
        className="usa-form usa-form--large"
        name="documents-form"
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
