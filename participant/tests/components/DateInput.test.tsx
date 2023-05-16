import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";

import { DateInput } from "app/components/DateInput";
import type { DateInputProps } from "app/components/DateInput";
import { useField } from "remix-validated-form";
import { mockUseField } from "tests/helpers/remixValidatedFormMock";

jest.mock("remix-validated-form");
const mockedUseField = jest.mocked(useField);
mockedUseField.mockImplementation(mockUseField);

const defaultProps: DateInputProps = {
  id: "date-example",
  name: "date-example",
  dateKey: "test:dateinput",
  legendKey: "test:dateinput.legend",
  keyBase: "date",
};

it("renders the default date component", () => {
  const { container } = renderWithRouter(<DateInput {...defaultProps} />);
  expect(container).toMatchSnapshot();
  const hint = screen.queryByText("For Example");
  expect(hint).not.toBeInTheDocument;

  const inputBoxes = screen.getAllByRole("textbox");
  expect(inputBoxes).toHaveLength(3);
  expect(inputBoxes[0].id).toBe("date-example.month");
  expect(inputBoxes[1].id).toBe("date-example.day");
  expect(inputBoxes[2].id).toBe("date-example.year");
});

it("renders the date component with hint", () => {
  renderWithRouter(<DateInput {...defaultProps} hint={true} />);
  const hint = screen.getByText("For Example: 4 28 1986");
  expect(hint).toBeInTheDocument;
});

it("renders date component with DMY fields", () => {
  renderWithRouter(<DateInput {...defaultProps} DMYorder={true} />);

  const inputBoxes = screen.getAllByRole("textbox");
  expect(inputBoxes).toHaveLength(3);
  expect(inputBoxes[0].id).toBe("date-example.day");
  expect(inputBoxes[1].id).toBe("date-example.month");
  expect(inputBoxes[2].id).toBe("date-example.year");
});

it("renders date component with DMY hint", () => {
  renderWithRouter(<DateInput {...defaultProps} DMYorder={true} hint={true} />);
  const hint = screen.getByText("For Example: 28 4 1986");
  expect(hint).toBeInTheDocument;
});

it("renders the date component with required", () => {
  renderWithRouter(<DateInput {...defaultProps} required={true} />);
  const inputBoxes = screen.getAllByRole("textbox");
  expect(inputBoxes[0].getAttribute("required")).toBe("");
  expect(inputBoxes[1].getAttribute("required")).toBe("");
  expect(inputBoxes[2].getAttribute("required")).toBe("");
});
