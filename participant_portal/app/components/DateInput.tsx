import type { ReactElement } from "react";
import { TextField } from "app/components/TextField";
import {
  DateInput as USWDS_DateInput,
  Fieldset,
  DateInputGroup,
} from "@trussworks/react-uswds";
import type { i18nKey } from "~/types";
import { Trans, useTranslation } from "react-i18next";

export type DateInputProps = {
  id: string;
  name: string;
  monthKey: i18nKey;
  dayKey: i18nKey;
  yearKey: i18nKey;
  DMYorder?: boolean;
  legendKey: i18nKey;
  legendStyle?: "default" | "large" | "srOnly" | undefined;
  hintKey: i18nKey;
  hint?: boolean;
};

export const DateInput = (props: DateInputProps): ReactElement => {
  const {
    id,
    name,
    monthKey,
    dayKey,
    yearKey,
    legendKey,
    legendStyle = "default",
    hint = false,
    hintKey,
    DMYorder = false,
  } = props;
  const { t } = useTranslation();
  const hintElement =
    hint && hintKey ? (
      <div className="usa-hint" id="dateOfBirthHint">
        <Trans i18nKey={hintKey} />
      </div>
    ) : undefined;
  const day = (
    <USWDS_DateInput
      id={`${id}-day`}
      label={t(dayKey)}
      unit="day"
      maxLength={2}
      minLength={2}
      name={name}
    />
  );
  const month = (
    <USWDS_DateInput
      id={`${id}-month`}
      label={t(monthKey)}
      unit="month"
      maxLength={2}
      minLength={2}
      name={name}
    />
  );
  const year = (
    <USWDS_DateInput
      id={`${id}-year`}
      label={t(yearKey)}
      unit="year"
      maxLength={4}
      minLength={4}
      name={name}
    />
  );
  const orderedDateField = DMYorder ? [day, month, year] : [month, day, year];
  return (
    <Fieldset legend={t(legendKey)} legendStyle={legendStyle}>
      {hintElement}
      <DateInputGroup>
        {orderedDateField?.map((dateField: ReactElement) => dateField)}
      </DateInputGroup>
    </Fieldset>
  );
};
