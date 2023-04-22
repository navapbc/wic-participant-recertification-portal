import type { ReactElement } from "react";
import { Fieldset, DateInputGroup, FormGroup } from "@trussworks/react-uswds";
import Required from "app/components/Required";
import { TextField } from "app/components/TextField";
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
    const maxLength = field == "year" ? 4 : 2;
    return (
      <FormGroup className={`usa-form-group--${field}`} key={`${id}-${field}`}>
        <TextField
          id={`${name}.${field}`}
          key={`${id}-${field}`}
          labelKey={`${dateKey}.${field}`}
          size={maxLength}
          inputType="text"
          type="input"
        />
      </FormGroup>
    );
  });
  return (
    <Fieldset legend={legendElement} legendStyle={legendStyle}>
      {hintElement}
      <DateInputGroup>{orderedDateFields}</DateInputGroup>
    </Fieldset>
  );
};
