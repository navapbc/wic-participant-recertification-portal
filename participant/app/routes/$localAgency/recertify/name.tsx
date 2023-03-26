import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { NameInput } from "~/components/NameInput";
import type { NameInputProps } from "~/components/NameInput";
import { ValidatedForm } from "remix-validated-form";
import { representativeNameSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const representativeNameValidator = withZod(representativeNameSchema);

export default function Index() {
  const { t } = useTranslation();
  const nameInputProps: NameInputProps = {
    id: "representative",
    nameKey: "NameInput",
    legendStyle: "srOnly",
    legal: true,
    preferred: true,
  };

  return (
    <div>
      <h1>{t("Name.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Name.intro" />
      </div>
      <br />
      <div>
        <Trans i18nKey="Name.body" />
      </div>
      <ValidatedForm validator={representativeNameValidator}>
        <NameInput {...nameInputProps} />
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          {t("Name.button")}
        </Button>
      </ValidatedForm>
    </div>
  );
}
