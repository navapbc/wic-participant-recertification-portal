import { Alert, Button } from "@trussworks/react-uswds";
import React from "react";
import { useEffect } from "react";

import { Trans } from "react-i18next";
import { TextField } from "app/components/TextField";
import type { TextFieldProps } from "app/components/TextField";
import { List } from "app/components/List";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import { countSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { cookieParser } from "app/cookies.server";
import { checkRoute, routeFromCount } from "~/utils/routing";
import {
  upsertSubmissionForm,
  fetchSubmissionData,
  findSubmissionFormData,
} from "app/utils/db.server";
import type { CountData } from "~/types";

const countValidator = withZod(countSchema);

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

  const householdSize = existingSubmissionData.participant?.length || existingSubmissionData.count?.householdSize || undefined

  console.log(`from details: ${existingSubmissionData.participant?.length}`)
  console.log(`from count: ${existingSubmissionData.count?.householdSize}`)
  console.log(`household should now be: ${householdSize}`)

  const existingCountData = { householdSize: householdSize }
  console.log(existingCountData)

  return json(
    {
      submissionID: submissionID,
      data: existingCountData,
      ...setFormDefaults("householdSizeForm", existingCountData),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();

  console.log(`In action, next up is formData:`)
  console.log(formData)

  const validationResult = await countValidator.validate(formData);
  if (validationResult.error) {
    console.log(`Validation error: ${validationResult.error}`);
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = countSchema.parse(formData);

  console.log(`next up is parsedForm:`)
  console.log(parsedForm)

  const { submissionID } = await cookieParser(request);
  console.log(`Got submission ${JSON.stringify(parsedForm)}`);
  await upsertSubmissionForm(submissionID, "count", parsedForm);
  const routeTarget = routeFromCount(request, parsedForm);
  console.log(`Completed count form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Count() {
  useLoaderData<loaderData>();
  const householdSizeProps: TextFieldProps = {
    id: "householdSize",
    type: "input",
    inputType: "number",
    labelKey: "Count.householdSize.label",
    required: true,
    className: "width-8",
    labelClassName: "usa-label--large",
  };
  return (
    <div>
      <h1>
        <Trans i18nKey="Count.title" />
      </h1>
      <p className="intro">
        <Trans i18nKey="Count.intro" />
      </p>
      <p>
        <Trans i18nKey="Count.body" />
      </p>
      <List i18nKey="Count.listItems" type="unordered" />
      <p>
        <Trans i18nKey="Count.example" />
      </p>
      <RequiredQuestionStatement />
      <ValidatedForm
        validator={countValidator}
        id="householdSizeForm"
        method="post"
      >
        <div className="margin-top-2">
          {disableHouseholdSize && (
            <Alert
              type="warning"
              headingLevel="h6"
              slim={true}
              role="status"
              className="margin-bottom-2"
            >
              <Trans i18nKey={"Count.previouslySubmittedAlert"} />
            </Alert>
          )}
        </div>
        <TextField {...householdSizeProps} />
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Count.householdSize.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
