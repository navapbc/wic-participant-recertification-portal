import type { ReactElement } from "react";
import type { i18nKey, legendStyleType } from "~/types";

import { Trans, useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@trussworks/react-uswds";
import { RelationshipInput } from "~/components/RelationshipInput";
import type { RelationshipInputProps } from "app/components/RelationshipInput";
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
  adjunctiveRequired?: boolean;

  clickHandler: Function;

  dateKey: i18nKey;
  dateLegendKey: i18nKey;
  dateLegendStyle?: legendStyleType;
  dateHint?: boolean;
  dateDMYOrder?: boolean;
  dateRequired?: boolean;

  nameKey: i18nKey;
  nameLegal?: boolean;
  namePreferred?: boolean;

  participantHeaderClassName?: string;
  participantKey: i18nKey;

  relationshipKey: i18nKey;
  relationshipRequired?: boolean;
};

export const ParticipantCard = (props: ParticipantCardProps): ReactElement => {
  const {
    index,
    adjunctiveKey,
    adjunctiveLegendStyle = "default",
    adjunctiveRequired,
    clickHandler,
    dateKey,
    dateLegendKey,
    dateLegendStyle,
    dateHint,
    dateDMYOrder,
    dateRequired,
    nameKey,
    nameLegal,
    namePreferred,
    participantHeaderClassName,
    participantKey,
    relationshipKey,
    relationshipRequired,
  } = props;

  const relationshipProps: RelationshipInputProps = {
    relationshipKey: relationshipKey,
    legendKey: `${relationshipKey}.label`,
    name: `participant[${index}].relationship`,
    required: relationshipRequired,
  };
  const nameProps: NameInputProps = {
    id: `participant[${index}]`,
    nameKey: nameKey,
    legendStyle: "srOnly",
    legal: nameLegal,
    preferred: namePreferred,
  };
  const dateProps: DateInputProps = {
    id: `participant-${index}-dob`,
    name: `participant[${index}].dob`,
    dateKey: dateKey,
    legendKey: dateLegendKey,
    legendStyle: dateLegendStyle,
    DMYorder: dateDMYOrder,
    hint: dateHint,
    required: dateRequired,
  };
  const adjunctiveProps: AdjunctiveInputProps = {
    name: `participant[${index}].adjunctive`,
    adjunctiveKey: adjunctiveKey,
    legendStyle: adjunctiveLegendStyle,
    required: adjunctiveRequired,
  };
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <h2
          className={`usa-card__heading ${
            participantHeaderClassName || ""
          }`.trim()}
        >
          <Trans i18nKey={`${participantKey}.cardHeader`} /> {index + 1}
        </h2>
      </CardHeader>
      <CardBody>
        <RelationshipInput {...relationshipProps} />
        <NameInput {...nameProps} />
        <DateInput {...dateProps} />
        <AdjunctiveInput {...adjunctiveProps} />
      </CardBody>
      <CardFooter>
        <button
          type="button"
          name="remove"
          className="text-secondary-vivid usa-button--unstyled"
          onClick={() => clickHandler(index)}
        >
          {t(`${participantKey}.cardFooter`, { participantIndex: index + 1 })}
        </button>
      </CardFooter>
    </Card>
  );
};
