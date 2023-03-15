import { screen } from "@testing-library/react";
import { renderWithRouter } from "tests/helpers/setup";
import TransLinks from "app/components/TransLinks";

const alpha = "https://external.com";
const beta = "/relative/link";

it("should render a string with one internal link and no styles", () => {
  renderWithRouter(
    <TransLinks
      i18nTextKey="test:translinks.plainStringLinks.text"
      i18nLinkKey="test:translinks.plainStringLinks.links"
    />
  );
  expect(
    screen.getByRole("link", { name: "second" }).getAttribute("href")
  ).toBe(alpha);
});

it("should render a string with multiple links and no styles", () => {
  renderWithRouter(
    <TransLinks
      i18nTextKey="test:translinks.plainStringLinks.text"
      i18nLinkKey="test:translinks.plainStringLinks.links"
    />
  );
  expect(
    screen.getByRole("link", { name: "second" }).getAttribute("href")
  ).toBe(alpha);
  expect(screen.getByRole("link", { name: "third" }).getAttribute("href")).toBe(
    beta
  );
});

it("should render a string with multiple internal links reused links and out of order", () => {
  renderWithRouter(
    <TransLinks
      i18nTextKey="test:translinks.plainStringLinksComplicated.text"
      i18nLinkKey="test:translinks.plainStringLinksComplicated.links"
    />
  );
  expect(
    screen.getByRole("link", { name: "second" }).getAttribute("href")
  ).toBe(alpha);
  expect(
    screen.getByRole("link", { name: "fourth" }).getAttribute("href")
  ).toBe(alpha);
  expect(screen.getByRole("link", { name: "first" }).getAttribute("href")).toBe(
    beta
  );
  expect(screen.getByRole("link", { name: "fifth" }).getAttribute("href")).toBe(
    beta
  );
});

it("should render a string with one internal link and styles", () => {
  renderWithRouter(
    <TransLinks
      i18nTextKey="test:translinks.styledString.text"
      i18nLinkKey="test:translinks.styledString.links"
    />
  );
  // eslint-disable-next-line -- This is a valid assertion
  expect(screen.getByText("first", { exact: false })).toBeInTheDocument;
  screen.getByText((content, element) => {
    return element === null
      ? false
      : element.tagName.toLowerCase() === "strong" &&
          content.startsWith("second");
  });
  expect(screen.getByRole("link", { name: "third" }).getAttribute("href")).toBe(
    alpha
  );
});

it("should render a string with a styled internal link", () => {
  renderWithRouter(
    <TransLinks
      i18nTextKey="test:translinks.styledLink.text"
      i18nLinkKey="test:translinks.styledLink.links"
    />
  );

  // eslint-disable-next-line -- This is a valid assertion
  expect(screen.getByText("first", { exact: false })).toBeInTheDocument;
  screen.getByText((content, element) => {
    return element === null
      ? false
      : element.tagName.toLowerCase() === "strong";
  });
  expect(
    screen.getByRole("link", { name: "second" }).getAttribute("href")
  ).toBe(alpha);
});
