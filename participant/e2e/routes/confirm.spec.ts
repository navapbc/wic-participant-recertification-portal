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

test("confirm has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await runTheForms(page);
  await page.getByRole("button", { name: "Submit my information" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/confirm");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await runTheForms(page);
  await page.getByRole("button", { name: "Submit my information" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/confirm");
  await expect(page).toHaveTitle(/Thanks for starting your recertification!/);
  await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
});

test("there are no edit buttons on the page", async ({ page }) => {
  await runTheForms(page);
  await page.getByRole("button", { name: "Submit my information" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/confirm");
  await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
});

test("hitting the back button after submission shows a warning", async ({
  page,
}) => {
  await runTheForms(page);
  await page.getByRole("button", { name: "Submit my information" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/confirm");
  await page.goBack();
  await expect(page).toHaveURL(
    "/gallatin/recertify/confirm?previouslySubmitted=true"
  );
  const noEditing = page.getByTestId("alert");
  await expect(noEditing).toHaveText(
    /You cannot review information after it’s submitted/
  );
  const startOverLink = page.getByRole("link", { name: "Start over" });
  await expect(startOverLink).toHaveCount(1);
  await startOverLink.click();
  await expect(page).toHaveURL("/gallatin/recertify/?newSession=true");
});
