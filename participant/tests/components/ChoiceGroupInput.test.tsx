import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";

import { ChoiceGroupInput } from "app/components/ChoiceGroupInput";

import type {
  ChoiceGroupInputProps,
  Choice,
} from "app/components/ChoiceGroupInput";
import { useField } from "remix-validated-form";
jest.mock("remix-validated-form");
import { mockUseField } from "tests/helpers/remixValidatedFormMock";
const mockedUseField = jest.mocked(useField);
mockedUseField.mockImplementation(mockUseField);

const choices: Choice[] = ["a", "b", "c"].map((option) => {
  return {
    value: option,
    labelElement: <div>label {option}</div>,
  };
});

const testProps: Omit<ChoiceGroupInputProps, "type"> = {
  choices: choices,
  name: "test-choices",
  legendKey: "title",
  required: false,
};

it("should match snapshot when it is a set of checkboxes", () => {
  const { container } = renderWithRouter(
    <ChoiceGroupInput {...testProps} type="checkbox" />
  );
  expect(container).toMatchSnapshot();
});

it("should match snapshot when it is a set of radio buttons", () => {
  const { container } = renderWithRouter(
    <ChoiceGroupInput {...testProps} type="radio" />
  );
  expect(container).toMatchSnapshot();
});

it("should match display required marker if required is true", () => {
  renderWithRouter(
    <ChoiceGroupInput {...testProps} required={true} type="checkbox" />
  );
  const required = screen.getByText("*");
  expect(required).toBeInTheDocument;
});

it("should display an helpElement if passed as props", () => {
  renderWithRouter(
    <ChoiceGroupInput
      {...testProps}
      type="checkbox"
      helpElement={<div data-testid="test-help">Helpful Help</div>}
    />
  );
  const helpElement = screen.getByTestId("test-help");
  expect(helpElement).toBeInTheDocument;
  expect(helpElement.textContent).toBe("Helpful Help");
});
