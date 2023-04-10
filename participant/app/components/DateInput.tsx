import type { ReactElement } from "react";
import {
  DateInput as USWDSDateInput,
  Fieldset,
  DateInputGroup,
} from "@trussworks/react-uswds";
import Required from "app/components/Required";
import type { i18nKey, legendStyleType } from "~/types";
import { Trans, useTranslation } from "react-i18next";

type DateFieldTypes = "day" | "month" | "year";

export type DateInputProps = {
  id: string;
  name: string;
  dateKey: i18nKey;
  DMYorder?: boolean;
  legendKey: i18nKey;
  legendStyle?: legendStyleType;
  hint?: boolean;
  required?: boolean;
};

export const DateInput = (props: DateInputProps): ReactElement => {
  const {
    id,
    name,
    dateKey,
    legendKey,
    legendStyle = "default",
    hint = false,
    DMYorder = false,
    required = false,
  } = props;
  const { t } = useTranslation();
  const legendElement = (
    <div>
      <Trans i18nKey={legendKey} />
      {required ? <Required /> : ""}
    </div>
  );
  const hintKey = DMYorder ? `${dateKey}.hintDMY` : `${dateKey}.hintMDY`;
  const hintElement =
    hint && t(hintKey) ? (
      <div className="usa-hint" id="dateOfBirthHint">
        <Trans i18nKey={hintKey} />
      </div>
    ) : undefined;

  const orderedFields: DateFieldTypes[] = DMYorder
    ? ["day", "month", "year"]
    : ["month", "day", "year"];
  const orderedDateFields = orderedFields.map((field: DateFieldTypes) => {
    const len = field == "year" ? 4 : 2;
    return (
      <USWDSDateInput
        id={`${id}-${field}`}
        key={`${id}-${field}`}
        label={t(`${dateKey}.${field}`)}
        unit={field}
        maxLength={len}
        minLength={len}
        name={`${name}-${field}`}
      />
    );
  });
  return (
    <Fieldset legend={legendElement} legendStyle={legendStyle}>
      {hintElement}
      <DateInputGroup>{orderedDateFields}</DateInputGroup>
    </Fieldset>
  );
};
