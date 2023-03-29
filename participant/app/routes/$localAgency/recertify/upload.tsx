import { FileInput } from "app/components/FileInput";
// import { FileInput } from "@trussworks/react-uswds";
import type { FileInputProps } from "app/components/FileInput";
import { ValidatedForm, validationError } from "remix-validated-form";
import { withZod } from "@remix-validated-form/with-zod";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { Button } from "@trussworks/react-uswds";
import { Form } from "@remix-run/react";
import { unstable_parseMultipartFormData } from "@remix-run/server-runtime";
import { unstable_createFileUploadHandler } from "@remix-run/node";
const docUploadSchema = zfd.formData({
  documents: zfd.repeatable(zfd.file()),
});

const docValidator = withZod(docUploadSchema);

export const action = async ({ request }: { request: Request }) => {
  const uploadHandler = unstable_createFileUploadHandler({
    maxPartSize: 5_000_000,
    file: ({ filename }) => filename,
  });
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  console.log(JSON.stringify(formData));
  const validationResult = await docValidator.validate(formData);
  if (validationResult.error) {
    console.log(
      `Validation error: ${validationResult.error} ${validationResult.data}`
    );
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = docUploadSchema.parse(formData);
  console.log(`Received ${JSON.stringify(parsedForm.documents)} from form`);
};

export default function Upload() {
  const defaultProps: FileInputProps = {
    id: "file-input-documents",
    name: "documents",
    labelKey: "FileInput",
    accept: "image/*,.pdf",
    maxFileCount: 5,
    maxFileSizeInBytes: 5_242_880,
  };
  return (
    <Form
      reloadDocument={true}
      //   validator={docValidator}
      method="post"
      id="uploadForm"
      encType="multipart/form-data"
      className="usa-form usa-form--large"
    >
      <FileInput {...defaultProps} />

      <Button type="submit" value="action" name="action">
        "Upload"
      </Button>
    </Form>
  );
}
