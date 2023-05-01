// details.spec.ts - tests for the details page
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  fillParticipantForm,
  fillCountForm,
  fillChangesForm,
  fillNameForm,
  fillUploadForm,
  fillContactForm,
} from "../helpers/formFillers";
import type { Participant } from "~/types";
import { readFileSync } from "fs";

const participantData: Participant = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Delightful",
  lastName: "Cheesemuffin",
  adjunctive: "no",
  relationship: "child",
};

const runTheForms = async (page: Page) => {
  const formFile = {
    name: "test-img.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("/srv/fixtures/fns-stock-produce-shopper.jpg"),
  };
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "yes", "yes", "/gallatin/recertify/upload");
  await fillUploadForm(page, formFile, "/gallatin/recertify/contact");
  await fillContactForm(
    page,
    "1234567890",
    "Example Comments",
    "/gallatin/recertify/review"
  );
};

test("review has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await runTheForms(page);
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await expect(page).toHaveTitle(/Review and submit your information./);
  await expect(page).toHaveScreenshot();
});

test("clicking edit on the name section navigates back to /name", async ({
  page,
}) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await page
    .getByRole("heading", { name: "What's your name? Edit" })
    .getByRole("link", { name: "Edit" })
    .click();
  await expect(page).toHaveURL("/gallatin/recertify/name");
});

test("clicking edit on the changes section navigates back to /changes", async ({
  page,
}) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await page
    .getByRole("heading", { name: "Household Changes Edit" })
    .getByRole("link", { name: "Edit" })
    .click();

  await expect(page).toHaveURL("/gallatin/recertify/changes");
});

test("clicking edit on the household section navigates back to /details", async ({
  page,
}) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await page
    .getByRole("heading", {
      name: "Who in your household is recertifying? Edit",
    })
    .getByRole("link", { name: "Edit" })
    .click();

  await expect(page).toHaveURL("/gallatin/recertify/details");
});

test("clicking edit on the documents section navigates back to /upload", async ({
  page,
}) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await page
    .getByRole("heading", { name: "Upload documents Edit" })
    .getByRole("link", { name: "Edit" })
    .click();

  await expect(page).toHaveURL("/gallatin/recertify/upload");
});

test("clicking edit on the contact section navigates back to /contact", async ({
  page,
}) => {
  await runTheForms(page);
  // Expect a title "to contain" a correct page title.
  await page
    .getByRole("heading", { name: "Additional information Edit" })
    .getByRole("link", { name: "Edit" })
    .click();

  await expect(page).toHaveURL("/gallatin/recertify/contact");
});
