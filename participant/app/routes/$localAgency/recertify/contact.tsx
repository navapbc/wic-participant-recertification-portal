import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { TextField } from "app/components/TextField";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { contactSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/node";
import { cookieParser } from "~/cookies.server";
import type { ContactData } from "~/types";
import { fetchSubmissionData, upsertSubmissionForm } from "~/utils/db.server";
import { checkRoute, routeFromContact } from "~/utils/routing";
import { useLoaderData } from "@remix-run/react";
import logger from "app/utils/logging.server";

const contactValidator = withZod(contactSchema);
export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const existingSubmissionData = await fetchSubmissionData(submissionID);
  checkRoute(request, existingSubmissionData);
  return json(
    {
      submissionID: submissionID,
      ...setFormDefaults(
        "contactForm",
        existingSubmissionData.contact as ContactData
      ),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const { submissionID } = await cookieParser(request);
  const formData = await request.formData();
  const validationResult = await contactValidator.validate(formData);
  if (validationResult.error) {
    logger.debug(
      {
        location: "routes/contact",
        type: "action.validation",
        validationError: validationResult.error,
        submissionID: submissionID,
      },
      "Validation error"
    );
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = contactSchema.parse(formData);
  logger.info(
    {
      location: "routes/contact",
      type: "action.submission",
      parsedForm: parsedForm,
      submissionID: submissionID,
    },
    "Got submission"
  );
  await upsertSubmissionForm(submissionID, "contact", parsedForm);
  const routeTarget = routeFromContact(request);
  logger.info(
    {
      location: "routes/contact",
      type: "action.complete",
      routeTarget: routeTarget,
      submissionID: submissionID,
    },
    "Completed name form"
  );
  return redirect(routeTarget);
};

export default function Contact() {
  useLoaderData<loaderData>();
  return (
    <div>
      <h1>
        <Trans i18nKey="Contact.title" />
      </h1>
      <RequiredQuestionStatement />
      <ValidatedForm
        validator={contactValidator}
        id="contactForm"
        method="post"
      >
        <TextField
          id="phoneNumber"
          inputType="tel"
          labelKey="Contact.phoneNumber"
          required
          type="input"
          labelClassName="usa-label--large"
          className="width-card-lg"
        />
        <TextField
          id="additionalInfo"
          inputType="text"
          labelKey="Contact.additionalInfo.label"
          labelClassName="usa-label--large"
          hint={
            <div>
              <Trans i18nKey="Contact.additionalInfo.hint" />
            </div>
          }
          type="textarea"
        />

        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Contact.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
