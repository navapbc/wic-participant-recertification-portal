import { Button } from "@trussworks/react-uswds";
import React from "react";

import { Trans } from "react-i18next";
import { TextField } from "app/components/TextField";
import type { TextFieldProps } from "app/components/TextField";
import { List } from "app/components/List";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import { countSchema } from "~/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";

const countValidator = withZod(countSchema);

export default function Count() {
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
      <RequiredQuestionStatement />
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
