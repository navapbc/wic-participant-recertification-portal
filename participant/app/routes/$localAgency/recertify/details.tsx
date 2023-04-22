import { Button } from "@trussworks/react-uswds";
import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Params, useLoaderData } from "@remix-run/react";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Trans } from "react-i18next";
import { nanoid } from "nanoid";
import { CardGroup } from "@trussworks/react-uswds";
import { ParticipantCard } from "app/components/ParticipantCard";
import type { ParticipantCardProps } from "app/components/ParticipantCard";
import { RequiredQuestionStatement } from "app/components/RequiredQuestionStatement";
import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { participantSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import { cookieParser } from "app/cookies.server";
import {
  findSubmissionFormData,
  upsertSubmissionForm,
} from "app/utils/db.server";
import { routeFromDetails } from "app/utils/routing";
import { Participant } from "~/types";
import { indexOf } from "lodash";

const detailsValidator = withZod(participantSchema);

export type ParticipantCardKeysState = string[];

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const url = new URL(request.url);
  const existingParticipantData = {
    participant: (await findSubmissionFormData(
      submissionID,
      "details"
    )) as Participant[],
  };
  const count =
    existingParticipantData.participant?.length ||
    url.searchParams.get("count") ||
    1;
  return json({
    participantCount: count,
    ...setFormDefaults("householdDetailsForm", existingParticipantData),
  });
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const validationResult = await detailsValidator.validate(formData);
  if (validationResult.error) {
    console.log(`Validation error: ${validationResult.error}`);
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = participantSchema.parse(formData);
  const { submissionID } = await cookieParser(request);
  console.log(`Got submission ${JSON.stringify(parsedForm)}`);
  await upsertSubmissionForm(submissionID, "details", parsedForm.participant);
  const routeTarget = routeFromDetails(request, parsedForm);
  console.log(`Completed details form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Details() {
  const removeCard = (cardTag: string) => {
    const indexToDelete = indexOf(participantKeys, cardTag);
    const prunedCardKeys = participantKeys.splice(indexToDelete, 1);
    setParticipantKeys(prunedCardKeys);
  };
  const { participantCount } = useLoaderData<typeof loader>();
  const participantProps: Omit<ParticipantCardProps, "index"> = {
    adjunctiveKey: "AdjunctiveEligibility",
    adjunctiveRequired: true,
    clickHandler: removeCard,
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

  const generateCardKeys = (count: number): ParticipantCardKeysState => {
    return Array.from({ length: count }).map((it, index) => {
      return nanoid();
    });
  };

  const [participantKeys, setParticipantKeys] =
    useState<ParticipantCardKeysState>(generateCardKeys(participantCount));
  const [participantCards, setParticipantCards] = useState(<></>);
  useEffect(() => {
    const newCards = participantKeys.map((value, index) => {
      return (
        <ParticipantCard
          key={`card-${value}`}
          index={index}
          {...participantProps}
        />
      );
    });
    setParticipantCards(<>{newCards}</>);
  }, [participantKeys]);

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
          value="submit"
        >
          <Trans i18nKey="Details.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
