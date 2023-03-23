import { Button } from "@trussworks/react-uswds";
import React from "react";
import type { ReactElement } from "react";
import { Form, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { Request } from "@remix-run/node";
import { Trans, useTranslation } from "react-i18next";

import { CardGroup } from "@trussworks/react-uswds";
import { ParticipantCard } from "app/components/ParticipantCard";
import type { ParticipantCardProps } from "app/components/ParticipantCard";

export function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const count = url.searchParams.get("count") || 1;

  return json({
    participantCount: count,
  });
}

type loaderData = {
  participantCount: number;
};

export default function Details() {
  const { t } = useTranslation();
  const { participantCount } = useLoaderData<loaderData>();
  const participantProps: Omit<ParticipantCardProps, "index"> = {
    adjunctiveKey: "AdjunctiveEligibility",
    dateKey: "DateOfBirth",
    dateLegendKey: "DateOfBirth.legend",
    nameKey: "NameInput",
    participantKey: "Detail.participantCard",
    relationshipKey: "Relationship",
  };

  const participantCards: ReactElement[] = Array.from({
    length: participantCount,
  }).map((it, index) => (
    <ParticipantCard
      key={`card-${index}`}
      index={index + 1}
      {...participantProps}
    />
  ));

  return (
    <div>
      <h1>{t("Details.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Detail.intro" />
      </div>
      <br />
      <div>
        <Trans i18nKey="Detail.body" />
      </div>
      <Form>
        <CardGroup>{participantCards}</CardGroup>
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          {t("Detail.button")}
        </Button>
      </Form>
    </div>
  );
}
