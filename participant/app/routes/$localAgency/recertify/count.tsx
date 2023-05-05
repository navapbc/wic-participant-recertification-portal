import { Button } from "@trussworks/react-uswds";
import React from "react";

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
import logger from "app/utils/logging.server";

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
  const existingCountData = (await findSubmissionFormData(
    submissionID,
    "count"
  )) as CountData;
  return json(
    {
      submissionID: submissionID,
      ...setFormDefaults("householdSizeForm", existingCountData),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const { submissionID } = await cookieParser(request);
  const formData = await request.formData();
  const validationResult = await countValidator.validate(formData);
  if (validationResult.error) {
    logger.debug(
      {
        location: "routes/count",
        type: "action.validation",
        validationError: validationResult.error,
        submissionID: submissionID,
      },
      "Validation error"
    );
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = countSchema.parse(formData);
  logger.debug(
    {
      location: "routes/count",
      type: "action.countData",
      formData: parsedForm,
      submissionID: submissionID,
    },
    "Count data received"
  );
  await upsertSubmissionForm(submissionID, "count", parsedForm);
  const routeTarget = routeFromCount(request, parsedForm);
  logger.info(
    {
      location: "routes/count",
      type: "action.complete",
      routeTarget: routeTarget,
      submissionID: submissionID,
    },
    "Completed count form; routing"
  );
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
