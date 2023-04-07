import { FileUploader } from "~/components/FileUploader";
import type {
  FileUploaderProps,
  FileInputRef,
} from "~/components/FileUploader";

import { Accordion, Button } from "@trussworks/react-uswds";
import { Form } from "@remix-run/react";
import { unstable_parseMultipartFormData as parseMultipartFormData } from "@remix-run/server-runtime";
import type { UploadHandler } from "@remix-run/server-runtime";
import { useRef } from "react";
import { useSubmit } from "@remix-run/react";
import { Trans, useTranslation } from "react-i18next";
import List from "~/components/List";

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
    return filename;
  };

  const formData = await parseMultipartFormData(request, uploadHandler);

  console.log(
    `Received ${JSON.stringify(formData.getAll("documents"))} from form`
  );
  return null;
};

export default function Upload() {
  const { t } = useTranslation();

  const defaultProps: FileUploaderProps = {
    id: "file-input-documents",
    name: "documents",
    labelKey: "FileUploader",
    accept: "image/*,.pdf",
    maxFileCount: 20,
    maxFileSizeInBytes: 5_242_880,
  };
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
