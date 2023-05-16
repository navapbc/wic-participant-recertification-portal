import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";
import { TextField } from "app/components/TextField";
import type { TextFieldProps } from "app/components/TextField";
import type { ChangeEvent } from "react";

import { useField } from "remix-validated-form";
import { mockUseField } from "tests/helpers/remixValidatedFormMock";

jest.mock("remix-validated-form");
const mockedUseField = jest.mocked(useField);
mockedUseField.mockImplementation(mockUseField);

const testProps: TextFieldProps = {
  id: "input-id",
  labelKey: "input label",
  required: false,
  inputType: "text",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => { },
};

it("should match snapshot when it is a textfield", () => {
  const { container } = renderWithRouter(
    <TextField {...testProps} type="input" />
  );
  expect(container).toMatchSnapshot();
});

it("should match snapshot when it is a textarea", () => {
  const { container } = renderWithRouter(
    <TextField {...testProps} type="textarea" />
  );
  expect(container).toMatchSnapshot();
});

it("should be a textfield by default", () => {
  renderWithRouter(<TextField {...testProps} />);
  const element = screen.getByRole("textbox");
  expect(element).toBeInTheDocument;
});

it("should match display required marker if required is true", () => {
  renderWithRouter(<TextField {...testProps} required={true} />);
  const required = screen.getByText("*");
  expect(required).toBeInTheDocument;
  const textbox = screen.getByRole("textbox")
  expect(textbox.getAttribute("required")).toBe("")
});

it("should display the value when it is a textfield", () => {
  renderWithRouter(
    <TextField {...testProps} type="input" value="textfield value" />
  );
  const textbox = screen.getByRole("textbox");
  expect(textbox.getAttribute("value")).toBe("textfield value");
});

it("should display the value when it is a textarea", () => {
  renderWithRouter(
    <TextField {...testProps} type="textarea" value="textarea value" />
  );
  const textbox = screen.getByRole("textbox");
  expect(textbox.textContent).toBe("textarea value");
});
