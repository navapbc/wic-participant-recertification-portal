import { act } from "@testing-library/react";
import { renderWithRouter } from "./setup";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactElement } from "react";
expect.extend(toHaveNoViolations);

export async function testAccessibility(element: ReactElement) {
  const { container } = renderWithRouter(element);

  // Must call axe() like this to satisfy react testing.
  let results;
  await act(async () => {
    results = await axe(container);
  });

  // eslint-disable-next-line -- This is a valid assertion
  expect(results).toHaveNoViolations;
}
