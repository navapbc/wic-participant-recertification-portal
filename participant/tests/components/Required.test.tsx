import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";

import Required from "app/components/Required";

it("should match snapshot", () => {
  const { container } = renderWithRouter(<Required />);
  expect(container).toMatchSnapshot();
  const asterisk = screen.getByText("*");
  expect(asterisk).toBeInTheDocument;
});
