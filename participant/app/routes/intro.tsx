import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("Intro.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Intro.intro" />
      </div>
      <div>
        <Trans i18nKey="Intro.body" />
      </div>
      <Button className="display-block margin-top-6" type="button">
        {t("Intro.button")}
      </Button>
    </div>
  );
}
