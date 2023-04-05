import { RelationshipInput } from "app/components/RelationshipInput";
import type { RelationshipInputProps } from "app/components/RelationshipInput";

import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";

import { useField } from "remix-validated-form";
jest.mock("remix-validated-form");
import { mockUseField } from "tests/helpers/remixValidatedFormMock";
const mockedUseField = jest.mocked(useField);
mockedUseField.mockImplementation(mockUseField);

const testProps: RelationshipInputProps = {
  relationshipKey: "test:relationship",
  required: false,
  legendKey: "test:relationship.label",
  legendStyle: "default",
  name: "relationship",
};

it("renders the default adjunctive eligibility field", () => {
  const { container } = renderWithRouter(<RelationshipInput {...testProps} />);
  expect(container).toMatchSnapshot();
  const radioButtons = screen.getAllByRole("radio");

  expect(radioButtons).toHaveLength(5);
  expect(radioButtons[0].id).toBe("relationship-self");
  expect(radioButtons[1].id).toBe("relationship-child");
  expect(radioButtons[2].id).toBe("relationship-grandchild");
  expect(radioButtons[3].id).toBe("relationship-foster");
  expect(radioButtons[4].id).toBe("relationship-other");
});

it("renders the the field with a large legend", () => {
  renderWithRouter(<RelationshipInput {...testProps} legendStyle="large" />);
  const largeHeader = screen
    .getByRole("group", {
      name: /Relationship to you/,
    })
    .getElementsByClassName("usa-legend--large");
  expect(largeHeader).toBeInTheDocument;
});

it("should match display required marker if required is true", () => {
  renderWithRouter(<RelationshipInput {...testProps} required={true} />);
  const required = screen.getByText("*");
  expect(required).toBeInTheDocument;
});
