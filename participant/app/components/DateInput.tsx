import type { ReactElement } from "react";
import {
  Fieldset,
  DateInputGroup,
  FormGroup,
  Label,
  ErrorMessage,
} from "@trussworks/react-uswds";
import Required from "app/components/Required";
import { TextInput } from "@trussworks/react-uswds";
import { useField } from "remix-validated-form";
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
  keyBase: string;
  values?: {
    day: number;
    month: number;
    year: number;
  };
};

export const DateInput = (props: DateInputProps): ReactElement => {
  const {
    name,
    dateKey,
    legendKey,
    legendStyle = "default",
    hint = false,
    DMYorder = false,
    required = false,
    keyBase,
    values,
  } = props;
  const { t } = useTranslation();
  const { error, clearError, validate } = useField(name);
  const legendElement = (
    <div>
      <Trans i18nKey={legendKey} />
      {required ? <Required /> : ""}
    </div>
  );
  const onBlurFunc = () => {
    clearError();
    validate();
  };
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
      <FormGroup
        className={`usa-form-group--${field}`}
        key={`${keyBase}-${field}`}
      >
        <Label htmlFor={`${name}.${field}`}>{t(`${dateKey}.${field}`)}</Label>
        <TextInput
          id={`${name}.${field}`}
          name={`${name}.${field}`}
          size={maxLength}
          type="text"
          required={required}
          onBlur={onBlurFunc}
          defaultValue={values && values[field]?.toString()}
        />
      </FormGroup>
    );
  });
  return (
    <Fieldset legend={legendElement} legendStyle={legendStyle}>
      {error && (
        <ErrorMessage id={`${name}-error-message`}>{error}</ErrorMessage>
      )}
      {hintElement}
      <DateInputGroup>{orderedDateFields}</DateInputGroup>
    </Fieldset>
  );
};
