import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { ButtonLink } from "app/components/ButtonLink";
import { List } from "app/components/List";

export default function Index() {
  const { t } = useTranslation();
  const listUserKeys: string[] = [
    "Index.ifLink",
    "Index.ifReceivesWIC",
    "Index.ifThirtyDays",
  ];

  return (
    <div>
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
      <List listKeys={listUserKeys} ordered={true} />
      <div>
        <p>
          <Trans i18nKey="Index.note" />
        </p>
        <p>
          <Trans i18nKey="Index.time" />
        </p>
      </div>
      <ButtonLink to="about" className="margin-top-6">
        {t("Index.button")}
      </ButtonLink>
    </div>
  );
}
