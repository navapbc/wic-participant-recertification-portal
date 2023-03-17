import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Index() {
  const { t } = useTranslation();
  const listUserKeys: string[] = ["ifLink", "ifReceivesWIC", "ifThirtyDays"];

  return (
    <div className="measure-6">
      <h1>{t("Index.title")}</h1>
      <div className="font-sans-lg">
        <p>
          <Trans i18nKey="Index.intro" />
        </p>
      </div>
      <div>
        <p>
          <Trans i18nKey="Index.eligible" />
        </p>
      </div>
      <ol className="usa-list">
        {listUserKeys.map((key: string) => (
          <li key={key}>
            <Trans i18nKey={`Index.${key}`} />
          </li>
        ))}
      </ol>
      <div>
        <p>
          <Trans i18nKey="Index.note" />
        </p>
        <p>
          <Trans i18nKey="Index.time" />
        </p>
      </div>
      <Button className="display-block margin-top-6" type="button">
        {t("Index.button")}
      </Button>
    </div>
  );
}
