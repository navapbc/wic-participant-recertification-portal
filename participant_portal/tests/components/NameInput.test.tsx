import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";

import { NameInput } from "app/components/NameInput";
import type { NameInputProps } from "app/components/NameInput";

const defaultProps: NameInputProps = {
  id: "input-example",
  nameKey: "test:nameinput",
  legendStyle: "srOnly",
};

it("renders name input component", () => {
  const { container } = renderWithRouter(<NameInput {...defaultProps} />);
  expect(container).toMatchSnapshot();
  const firstName = screen.getByRole("textbox", { name: /First name/ });
  expect(firstName).toBeInTheDocument;
});

it("renders name input with preferred field", () => {
  renderWithRouter(<NameInput {...defaultProps} preferred={true} />);
  const preferredName = screen.getByRole("textbox", { name: /Preferred name/ });
  expect(preferredName).toBeInTheDocument;
});

it("renders without legal hint", () => {
  renderWithRouter(<NameInput {...defaultProps} legal={false} />);
  const firstName = screen.getByRole("textbox", { name: "First name *" });
  expect(firstName).toBeInTheDocument;
  const lastName = screen.getByRole("textbox", { name: "Last name *" });
  expect(lastName).toBeInTheDocument;
});
