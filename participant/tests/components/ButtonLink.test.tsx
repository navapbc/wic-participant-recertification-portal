import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";
import { ButtonLink } from "app/components/ButtonLink";

it("should render a button using an internal to target", () => {
  const { container } = renderWithRouter(
    <ButtonLink to="bogus">Button Text</ButtonLink>
  );
  expect(container).toMatchSnapshot();
  expect(
    screen.getByRole("link", { name: "Button Text" }).getAttribute("href")
  ).toBe("/bogus");
});

it("should render a button using an external to target", () => {
  const { container } = renderWithRouter(
    <ButtonLink to="https://google.com">Button Text</ButtonLink>
  );
  expect(container).toMatchSnapshot();
  expect(
    screen.getByRole("link", { name: "Button Text" }).getAttribute("href")
  ).toBe("https://google.com");
});
