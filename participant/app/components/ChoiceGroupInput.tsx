import { Trans } from "react-i18next";
import type { ChangeEvent, ReactElement } from "react";
import {
  Fieldset,
  Checkbox,
  Radio,
  ErrorMessage,
} from "@trussworks/react-uswds";

import Required from "app/components/Required";
import { useField } from "remix-validated-form";
import type { i18nKey, legendStyleType } from "app/types";

export type Choice = {
  value: string;
  labelElement: ReactElement;
};

export type ChoiceGroupInputProps = {
  name: string;
  choices: Choice[];
  legendKey: i18nKey;
  legendStyle?: legendStyleType;
  required?: boolean;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type: "checkbox" | "radio";
  error?: string;
  helpElement?: ReactElement;
};

export const ChoiceGroupInput = (
  props: ChoiceGroupInputProps
): ReactElement => {
  const {
    choices,
    legendKey,
    legendStyle = "default",
    required,
    type,
    helpElement,
    name,
    handleChange,
  } = props;
  const { getInputProps, error } = useField(name);
  const InputTypeClass = type == "checkbox" ? Checkbox : Radio;
  if (!choices?.length) {
    return <></>;
  }
  const legendElement = (
    <div>
      <Trans i18nKey={legendKey} />
      {required ? <Required /> : ""}
    </div>
  );
  return (
    <>
      <Fieldset legend={legendElement} legendStyle={legendStyle}>
        {error && (
          <ErrorMessage id={`${legendKey}-error-message`}>{error}</ErrorMessage>
        )}
        {helpElement}
        {choices?.map((choice: Choice) => (
          <InputTypeClass
            key={`${name}-${choice.value}`}
            {...getInputProps({
              id: `${name}-${choice.value}`,
              label: choice.labelElement,
              type: type,
              value: choice.value,
              onChange: handleChange,
            })}
          />
        ))}
      </Fieldset>
    </>
  );
};
