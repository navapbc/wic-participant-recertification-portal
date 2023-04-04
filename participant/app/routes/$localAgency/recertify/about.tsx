import { Alert } from "@trussworks/react-uswds";
import { ProcessList } from "@trussworks/react-uswds";
import { ProcessListHeading } from "@trussworks/react-uswds";
import { ProcessListItem } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { ButtonLink } from "app/components/ButtonLink";

export default function Index() {
  const listProcessKeys: string[] = ["answer", "upload", "appointment"];

  return (
    <div>
      <h1>
        <Trans i18nKey="About.title" />
      </h1>
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
        <Trans i18nKey="About.note" />
      </Alert>
      <ButtonLink to="../name" relative="path" className="margin-top-6">
        <Trans i18nKey="About.button" />
      </ButtonLink>
    </div>
  );
}
