import { Alert } from "@trussworks/react-uswds";
import { Button } from "@trussworks/react-uswds";
import { ProcessList } from "@trussworks/react-uswds";
import { ProcessListHeading } from "@trussworks/react-uswds";
import { ProcessListItem } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();
  const listProcessKeys: string[] = ["answer", "upload", "appointment"];

  return (
    <div className="measure-6">
      <h1>{t("About.title")}</h1>
      <ProcessList>
        {listProcessKeys.map((key: string) => (
          <ProcessListItem key={key}>
            <ProcessListHeading type="h2">
              <Trans i18nKey={`About.${key}.header`} />
            </ProcessListHeading>
            <p className="margin-top-1">
              <Trans i18nKey={`About.${key}.body`} />
            </p>
          </ProcessListItem>
        ))}
      </ProcessList>
      <Alert type="warning" headingLevel="h3" slim noIcon>
        {t("About.note")}
      </Alert>
      <Button className="display-block margin-top-6" type="button">
        {t("About.button")}
      </Button>
    </div>
  );
}
