import { Form } from "@remix-run/react";
// This WebPack shim is necessary to patch the useField hook
// and allow components that utilize useField to propagate errors
// and ValidatedForms (that require validators) to work in Storybook
export {
  validationError,
  setFormDefaults,
  createValidator,
  FieldErrors,
  Validator,
} from "../../node_modules/remix-validated-form";
// This is duplicative of the jest helper remixValidatedFormMock,
// but the Jest global missing breaks the component in Storybook

// This ends up being <form> in ./remix-react.tsx
export const ValidatedForm = Form;

type MinimalInputProps = {
  onChange?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
  defaultValue?: any;
  defaultChecked?: boolean;
  name?: string;
  type?: string;
};

export const getInputProps = <T extends MinimalInputProps>(
  props = {} as any
) => {
  return props as T;
};

// TODO: Figure out a way to determine whether this component is being
// rendered in a story with "error" in the name or route, so that
// an example error can be shown in Storybook
export const useField = (args: any) => {
  return { error: undefined, getInputProps };
};
