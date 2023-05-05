import { Alert, Button } from "@trussworks/react-uswds";
import React from "react";

import { Trans } from "react-i18next";
import { TextField } from "app/components/TextField";
import { ButtonLink } from "app/components/ButtonLink";
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
import { upsertSubmissionForm, fetchSubmissionData } from "app/utils/db.server";
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

  const actualHouseholdSize = existingSubmissionData.participant?.length;
  const existingCountData =
    actualHouseholdSize !== undefined
      ? { householdSize: actualHouseholdSize }
      : existingSubmissionData.count;

  const safeCountData =
    actualHouseholdSize !== undefined
      ? existingCountData
      : { householdSize: 1 };

  const routeTarget = routeFromCount(request, safeCountData as CountData);
  return json(
    {
      submissionID: submissionID,
      actualHouseholdSize: actualHouseholdSize,
      routeTarget: routeTarget,
      ...setFormDefaults("householdSizeForm", existingCountData as CountData),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const validationResult = await countValidator.validate(formData);
  if (validationResult.error) {
    console.log(`Validation error: ${validationResult.error}`);
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = countSchema.parse(formData);
  const { submissionID } = await cookieParser(request);
  console.log(`Got submission ${JSON.stringify(parsedForm)}`);
  await upsertSubmissionForm(submissionID, "count", parsedForm);
  const routeTarget = routeFromCount(request, parsedForm);
  console.log(`Completed count form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Count() {
  const { actualHouseholdSize, routeTarget } = useLoaderData<loaderData>();
  const disableHouseholdSize = actualHouseholdSize !== undefined;
  const householdSizeProps: TextFieldProps = {
    id: "householdSize",
    type: "input",
    inputType: "number",
    labelKey: "Count.householdSize.label",
    required: true,
    className: "width-8",
    labelClassName: "usa-label--large",
  };
  if (disableHouseholdSize) {
    householdSizeProps.disabled = true;
  }
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
        {disableHouseholdSize ? (
          <ButtonLink to={routeTarget} relative="path" className="margin-top-6">
            <Trans i18nKey="Count.householdSize.button" />
          </ButtonLink>
        ) : (
          <Button
            className="display-block margin-top-6"
            type="submit"
            formMethod="post"
          >
            <Trans i18nKey="Count.householdSize.button" />
          </Button>
        )}
      </ValidatedForm>
    </div>
  );
}
