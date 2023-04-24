import { Button } from "@trussworks/react-uswds";
import React from "react";
import type { ReactElement } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { Request } from "@remix-run/node";
import { Trans } from "react-i18next";

import { CardGroup } from "@trussworks/react-uswds";
import { ParticipantCard } from "app/components/ParticipantCard";
import type { ParticipantCardProps } from "app/components/ParticipantCard";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import { ValidatedForm } from "remix-validated-form";
import { householdDetailsSchema } from "~/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const detailsValidator = withZod(householdDetailsSchema);

export function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const count = url.searchParams.get("count");

  return json({
    participantCount: count,
  });
}

type loaderData = {
  participantCount: number;
};

export default function Details() {
  const { participantCount } = useLoaderData<loaderData>();
  const participantProps: Omit<ParticipantCardProps, "index"> = {
    adjunctiveKey: "AdjunctiveEligibility",
    adjunctiveRequired: true,
    dateHint: true,
    dateKey: "DateOfBirth",
    dateLegendKey: "DateOfBirth.legend",
    dateRequired: true,
    nameKey: "NameInput",
    participantKey: "Details.participantCard",
    namePreferred: true,
    relationshipKey: "Relationship",
    relationshipRequired: true,
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
      <h1>
        <Trans i18nKey="Details.title" />
      </h1>
      <RequiredQuestionStatement />
      <p className="intro">
        <Trans i18nKey="Details.intro" />
      </p>
      <ValidatedForm
        validator={detailsValidator}
        id="householdDetailsForm"
        method="post"
      >
        <CardGroup>{participantCards}</CardGroup>
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Details.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
