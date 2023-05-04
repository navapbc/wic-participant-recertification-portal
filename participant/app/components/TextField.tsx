import { Trans } from "react-i18next";
import type { ChangeEvent, ReactElement } from "react";

import Required from "app/components/Required";

import type { i18nKey } from "app/types";
import {
  ErrorMessage,
  Label,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";
import { useField, useControlField } from "remix-validated-form";

export type TextFieldProps = {
  handleChange?: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  id: string;
  labelKey: i18nKey;
  labelClassName?: string;
  hint?: ReactElement;
  required?: boolean;
  type?: "input" | "textarea";
  inputType:
    | "number"
    | "search"
    | "text"
    | "email"
    | "password"
    | "tel"
    | "url";
  defaultValue?: string;
  value?: string;
  className?: string;
  size?: number;
  disabled?: string;
  // useControlField?: boolean;
};

export const TextField = (props: TextFieldProps): ReactElement => {
  const {
    handleChange,
    id,
    labelKey,
    labelClassName,
    hint,
    required,
    type,
    inputType,
    defaultValue,
    value,
    className,
    size,
    ...otherProps
  } = props;

  console.log(`in the textfield`)
  console.log(`defaultValue: ${defaultValue}`)
  console.log(`value: ${value}`)
  const { getInputProps, error } = useField(id);
  // const [ fieldValue, setFieldValue ] = useControlField(id);
  // console.log(`fieldValue: ${fieldValue}`)

  const TextTypeClass = type == "textarea" ? Textarea : TextInput;
  let errorProp = {};
  if (error && type == "textarea") {
    errorProp = { error: true };
  } else if (error) {
    errorProp = { validationStatus: "error" };
  }
  return (
    <>
      <Label htmlFor={id} className={labelClassName} hint={hint}>
        <Trans i18nKey={labelKey} />
        {required && <Required />}
      </Label>
      {error && <ErrorMessage id={`${id}-error-message`}>{error}</ErrorMessage>}
      <TextTypeClass
        onChange={handleChange}
        defaultValue={defaultValue}
        size={size}
        {...errorProp}
        {...getInputProps({
          id: id,
          type: inputType,
          value: value,
          // value: fieldValue,
          className: className,
          ...otherProps,
        })}
      />
    </>
  );
};
