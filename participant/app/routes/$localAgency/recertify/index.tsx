import React from "react";
import { Trans } from "react-i18next";
import { ButtonLink } from "app/components/ButtonLink";
import { List } from "app/components/List";

export default function Index() {
  const listUserKeys: string[] = [
    "Index.ifLink",
    "Index.ifReceivesWIC",
    "Index.ifThirtyDays",
  ];

  return (
    <div>
      <h1>
        <Trans i18nKey="Index.title" />
      </h1>
      <p className="intro">
        <Trans i18nKey="Index.intro" />
      </p>
      <p>
        <Trans i18nKey="Index.eligible" />
      </p>
      <List listKeys={listUserKeys} type="ordered" />
      <p>
        <Trans i18nKey="Index.note" />
      </p>
      <p>
        <Trans i18nKey="Index.time" />
      </p>
      <ButtonLink to="about" className="margin-top-6">
        <Trans i18nKey="Index.button" />
      </ButtonLink>
    </div>
  );
}
