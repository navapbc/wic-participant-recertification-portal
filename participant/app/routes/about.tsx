import { Alert } from "@trussworks/react-uswds";
import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();
  const listProcessKeys: string[] = ["answer", "upload", "appointment"];

  return (
    <div className="measure-6">
      <h1>{t("About.title")}</h1>
      <ol className="usa-process-list">
        {listProcessKeys.map((key: string) => (
          <li className="usa-process-list__item" key={key}>
            <h2 className="usa-process-list__heading">
              <Trans i18nKey={`About.${key}Header`} />
            </h2>
            <p className="margin-top-1">
              <Trans i18nKey={`About.${key}`} />
            </p>
          </li>
        ))}
      </ol>
      <Alert type="warning" headingLevel="h3" slim noIcon>
        {t("About.note")}
      </Alert>
      <Button className="display-block margin-top-6" type="button">
        {t("About.button")}
      </Button>
    </div>
  );
}
