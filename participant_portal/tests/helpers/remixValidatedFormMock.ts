/* eslint-disable @typescript-eslint/no-explicit-any */
// As this is a mock for types we don't entirely control, disable no-explicit-any

// This file is the Jest mock for supporting remix-validated-form
// The useField hook will not work out of the box, and it returns a prop-getter -
// so our mock needs to as well
export const helpers = {
  error: undefined,
  touched: false,
  clearError: jest.fn(),
  validate: jest.fn(),
  setTouched: jest.fn(),
  defaultValue: "test default value",
};

type MinimalInputProps = {
  onChange?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
  defaultValue?: any;
  defaultChecked?: boolean;
  name?: string;
  type?: string;
};

export const getInputProps = <T extends MinimalInputProps>(
  props = {} as unknown
) => {
  return props as T;
};

export const mockUseFieldReturnValue = { ...helpers, getInputProps };
