import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";
import { AdjunctiveInput } from "app/components/AdjunctiveInput";
import type { AdjunctiveInputProps } from "app/components/AdjunctiveInput";

import { useField } from "remix-validated-form";
jest.mock("remix-validated-form");
import { mockUseField } from "tests/helpers/remixValidatedFormMock";
const mockedUseField = jest.mocked(useField);
mockedUseField.mockImplementation(mockUseField);

const testProps: AdjunctiveInputProps = {
  adjunctiveKey: "test:adjunctive",
  required: false,
  legendStyle: "default",
  name: "adjunctive",
};

it("renders the default adjunctive eligibility field", () => {
  const { container } = renderWithRouter(<AdjunctiveInput {...testProps} />);
  expect(container).toMatchSnapshot();
  expect(screen.getByRole("radio", { name: "Yes" })).toBeInTheDocument;
  expect(screen.getByRole("radio", { name: "No" })).toBeInTheDocument;
});

it("renders the the field with a large legend", () => {
  renderWithRouter(<AdjunctiveInput {...testProps} legendStyle="large" />);
  const largeHeader = screen
    .getByRole("group", {
      name: /Are they enrolled/,
    })
    .getElementsByClassName("usa-legend--large");
  expect(largeHeader).toBeInTheDocument;
});

it("should match display required marker if required is true", () => {
  renderWithRouter(<AdjunctiveInput {...testProps} required={true} />);
  const required = screen.getByText("*");
  expect(required).toBeInTheDocument;
});
