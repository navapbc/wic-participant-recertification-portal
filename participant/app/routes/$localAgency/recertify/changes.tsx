import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { withZod } from "@remix-validated-form/with-zod";
import { ChoiceGroupInput } from "app/components/ChoiceGroupInput";
import type { Choice } from "app/components/ChoiceGroupInput";
import { Button } from "@trussworks/react-uswds";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { Trans } from "react-i18next";

import List from "app/components/List";
import RequiredQuestionStatement from "app/components/RequiredQuestionStatement";
import { cookieParser } from "app/cookies.server";
import { changesSchema } from "app/utils/validation";
import type { ChangesData } from "app/types";
import { routeFromChanges } from "~/utils/routing";
import {
  upsertSubmissionForm,
  findSubmissionFormData,
} from "app/utils/db.server";

const changesValidator = withZod(changesSchema);

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
  return json(
    {
      submissionID: submissionID,
      ...setFormDefaults("changesForm", existingChangesData),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const validationResult = await changesValidator.validate(formData);
  if (validationResult.error) {
    console.log(`Validation error: ${validationResult.error}`);
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = changesSchema.parse(formData);
  const { submissionID } = await cookieParser(request);
  console.log(`Got submission ${JSON.stringify(parsedForm)}`);
  await upsertSubmissionForm(submissionID, "changes", parsedForm);
  const routeTarget = routeFromChanges(request, parsedForm);
  console.log(`Completed changes form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Changes() {
  useLoaderData<loaderData>();
  const idChangeHelp = (
    <List type="unordered" i18nKey="Changes.nameIdQuestion.situations" />
  );
  const ChangeChoices: Choice[] = [
    {
      value: "yes",
      labelElement: <Trans i18nKey={"Changes.yesAnswer"} />,
    },
    { value: "no", labelElement: <Trans i18nKey={"Changes.noAnswer"} /> },
  ];

  return (
    <div>
      <h1>
        <Trans i18nKey="Changes.title" />
      </h1>
      <RequiredQuestionStatement />
      <ValidatedForm
        validator={changesValidator}
        id="changesForm"
        method="post"
      >
        <ChoiceGroupInput
          name="idChange"
          type="radio"
          legendKey="Changes.nameIdQuestion.legend"
          legendStyle="large"
          helpElement={idChangeHelp}
          choices={ChangeChoices}
          required={true}
        />
        <ChoiceGroupInput
          name="addressChange"
          type="radio"
          legendStyle="large"
          legendKey="Changes.moveQuestion.legend"
          choices={ChangeChoices}
          required={true}
        />
        <Button type="submit" value="submit" className="margin-top-6">
          <Trans i18nKey="Changes.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
