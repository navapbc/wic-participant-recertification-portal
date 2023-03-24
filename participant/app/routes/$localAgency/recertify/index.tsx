import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { List } from "~/components/List";

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
      <Button className="display-block margin-top-6" type="button">
      <Trans i18nKey="Index.button" />
      </Button>
    </div>
  );
}
