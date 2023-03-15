import type { ReactElement } from "react";
import type { i18nKey, legendStyleType } from "~/types";

import { Trans } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@trussworks/react-uswds";
import { RelationshipInput } from "~/components/RelationshipInput";
import { NameInput } from "app/components/NameInput";
import type { NameInputProps } from "app/components/NameInput";
import { DateInput } from "app/components/DateInput";
import type { DateInputProps } from "app/components/DateInput";
import { AdjunctiveInput } from "~/components/AdjunctiveInput";
import type { AdjunctiveInputProps } from "~/components/AdjunctiveInput";

export type ParticipantCardProps = {
  index: number;

  adjunctiveKey: i18nKey;
  adjunctiveLegendStyle?: legendStyleType;

  dateKey: i18nKey;
  dateLegendKey: i18nKey;
  dateLegendStyle?: legendStyleType;
  dateHint?: boolean;
  dateDMYOrder?: boolean;

  nameKey: i18nKey;
  nameLegal?: boolean;
  namePreferred?: boolean;

  participantHeaderClassName?: string;
  participantKey: i18nKey;

  relationshipKey: i18nKey;
};

export const ParticipantCard = (props: ParticipantCardProps): ReactElement => {
  const {
    index,
    adjunctiveKey,
    adjunctiveLegendStyle = "default",
    dateKey,
    dateLegendKey,
    dateLegendStyle,
    dateHint,
    dateDMYOrder,
    nameKey,
    nameLegal,
    namePreferred,
    participantHeaderClassName = "font-sans-lg",
    participantKey,
    relationshipKey,
  } = props;

  const nameProps: NameInputProps = {
    id: `participant-${index}`,
    nameKey: nameKey,
    legendStyle: "srOnly",
    legal: nameLegal,
    preferred: namePreferred,
  };
  const dateProps: DateInputProps = {
    id: `participant-${index}-dob`,
    name: `participant-${index}-dob`,
    dateKey: dateKey,
    legendKey: dateLegendKey,
    legendStyle: dateLegendStyle,
    DMYorder: dateDMYOrder,
    hint: dateHint,
  };
  const adjunctiveProps: AdjunctiveInputProps = {
    name: `participant-${index}-adjunctive`,
    adjunctiveKey: adjunctiveKey,
    legendStyle: adjunctiveLegendStyle,
  };

  return (
    <Card>
      <CardHeader>
        <div className={participantHeaderClassName}>
          <strong>
            <Trans i18nKey={`${participantKey}.cardHeader`} /> {index}
          </strong>
        </div>
      </CardHeader>
      <CardBody>
        <RelationshipInput
          relationshipKey={relationshipKey}
          legendKey={`${relationshipKey}.label`}
          name={`participant-${index}-relationship`}
        />
        <NameInput {...nameProps} />
        <DateInput {...dateProps} />
        <AdjunctiveInput {...adjunctiveProps} />
      </CardBody>
      <CardFooter>
        {" "}
        <Trans i18nKey={`${participantKey}.cardFooter`} />
      </CardFooter>
    </Card>
  );
};
