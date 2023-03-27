import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Form } from "@remix-run/react";

import { Trans, useTranslation } from "react-i18next";
import { TextField } from "app/components/TextField";
import type { TextFieldProps } from "app/components/TextField";
import { List } from "app/components/List";

export default function Count() {
  const { t } = useTranslation();
  const householdSizeProps: TextFieldProps = {
    id: "householdSize",
    type: "input",
    inputType: "text",
    labelKey: "Count.householdSize.label",
  };
  // eslint-disable-next-line  @typescript-eslint/no-unnecessary-type-assertion
  const listItems = t("Count.listItems", {
    returnObjects: true,
  }) as Array<string>;
  return (
    <div>
      <h1>{t("Count.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Count.intro" />
      </div>
      <br />
      <div>
        <Trans i18nKey="Count.body" />
        <List listKeys={listItems} ordered={false} />
      </div>
      <div>
        <Trans i18nKey="Count.example" />
      </div>
      <Form>
        <TextField {...householdSizeProps} />
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          {t("Count.householdSize.button")}
        </Button>
      </Form>
    </div>
  );
}
