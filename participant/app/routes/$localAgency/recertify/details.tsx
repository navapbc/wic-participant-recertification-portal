import { Button } from "@trussworks/react-uswds";
import React, { useEffect, useState } from "react";
import {
  Params,
  useFetcher,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
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
import { routeFromDetails, routeRelative } from "app/utils/routing";
import { Participant } from "~/types";
import { toInteger } from "lodash";

const detailsValidator = withZod(participantSchema);

export type ParticipantCardKeysState = {
  [tag: string]: Participant | null;
};

const formatLoaderData = (
  participants: Participant[],
  count: number
): ParticipantCardKeysState => {
  const tags: ParticipantCardKeysState = {};

  for (let i = 0; i < count; i++) {
    if (participants?.at(i)) {
      tags[participants[i].tag!] = participants[i];
    } else {
      tags[nanoid()] = null;
    }
  }
  return tags;
};

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const url = new URL(request.url);
  let count: number;
  if (url.searchParams.get("action") == "remove_participant") {
    const removeParticipant = url.searchParams.get("participant");
    console.log(
      `⏳ Received request to remove participant ${removeParticipant}`
    );
    const uneditedParticipants = (await findSubmissionFormData(
      submissionID,
      "details"
    )) as Participant[];
    const filteredParticipants = uneditedParticipants?.filter(
      (value) => value?.tag != removeParticipant
    );
    if (uneditedParticipants?.length > filteredParticipants?.length) {
      await upsertSubmissionForm(submissionID, "details", filteredParticipants);
      console.log(`🗑 Removed participant ${removeParticipant} from database`);
    }
    return null;
  }
  const existingParticipantData = (await findSubmissionFormData(
    submissionID,
    "details"
  )) as Participant[];
  count =
    existingParticipantData?.length ||
    toInteger(url.searchParams.get("count")) ||
    1;
  const participantData = formatLoaderData(existingParticipantData, count);
  console.log(`Participant data ${JSON.stringify(participantData)}`);
  return json({
    participantCount: count,
    data: participantData,
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
  parsedForm.participant.forEach((participantCard) => {
    participantCard.tag = nanoid();
  });
  await upsertSubmissionForm(submissionID, "details", parsedForm.participant);
  const routeTarget = routeFromDetails(request, parsedForm);
  console.log(`Completed details form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Details() {
  const fetcher = useFetcher();

  const { data } = useLoaderData<typeof loader>();
  const [participantData, setParticipantData] =
    useState<ParticipantCardKeysState>(data as ParticipantCardKeysState);

  const removeCard = async (tag: string) => {
    fetcher.submit(
      {
        action: "remove_participant",
        participant: tag,
      },
      { method: "get" }
    );
    delete participantData[tag];
    if (!!Object.keys(participantData).length) {
      setParticipantData({ ...participantData });
    } else {
      addCard();
    }
  };
  const addCard = () => {
    participantData[nanoid()] = null;
    setParticipantData({ ...participantData });
  };
  const participantProps: Omit<ParticipantCardProps, "index" | "tag"> = {
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

  const filterValues = (
    unfiltered: ParticipantCardKeysState
  ): Participant[] => {
    const filteredValues: Participant[] = [];
    for (const value of Object.values(unfiltered)) {
      if (value !== null) {
        filteredValues.push(value);
      }
    }
    return filteredValues;
  };

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
        <CardGroup>
          {Object.keys(participantData).map((value, index) => {
            return (
              <ParticipantCard
                key={`card-${value}`}
                tag={`${value}`}
                index={index}
                values={participantData[value] || undefined}
                {...participantProps}
              />
            );
          })}
        </CardGroup>
        <Button
          className="display-block margin-top-2"
          type="button"
          onClick={addCard}
        >
          <Trans i18nKey="Details.addParticipant" />
        </Button>
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
