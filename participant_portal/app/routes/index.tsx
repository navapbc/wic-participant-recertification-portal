import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("Index.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Index.intro" />
      </div>
      <div>
        <Trans i18nKey="Index.body" />
      </div>
      <Button className="display-block margin-top-6" type="button">
        {t("Index.button")}
      </Button>
    </div>
  );
}
