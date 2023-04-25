// details.spec.ts - tests for the details page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fillParticipantForm, fillCountForm } from "../helpers/formFillers";
import type { Participant } from "~/types";

test("details has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  // Expect a title "to contain" a correct page title.
  await expect(page).toHaveTitle(/Tell us about who you're recertifying for/);
  await expect(page).toHaveScreenshot();
});

test("clicking add participant adds a card", async ({ page }) => {
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await expect(page.getByRole("heading", { name: /Participant/ })).toHaveCount(
    1
  );
  await page
    .getByRole("button", { name: "Add another WIC participant" })
    .click();
  await expect(page.getByRole("heading", { name: /Participant/ })).toHaveCount(
    2
  );
});

test("clicking remove participant removes a card", async ({ page }) => {
  await fillCountForm(page, 2, "/gallatin/recertify/details?count=2");
  await expect(page.getByRole("heading", { name: /Participant/ })).toHaveCount(
    2
  );
  await page.getByRole("button", { name: "Remove Participant 1" }).click();
  await expect(page.getByRole("heading", { name: /Participant/ })).toHaveCount(
    1
  );
});

test("filling in a participant, navigating away, returning and removing it works", async ({
  page,
}) => {
  const participantData = {
    dob: { day: 3, year: 2004, month: 2 },
    tag: "TtmTDA5JcBAWr0tUWWmit",
    firstName: "Delightful",
    lastName: "Cheesemuffin",
    adjunctive: "no",
    relationship: "child",
  };
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData as Participant, 0);
  await expect(page).toHaveScreenshot({ fullPage: true });

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await page.goto("/gallatin/recertify/details", { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/gallatin/recertify/details");
  const lastName = page.locator(`[id="participant[0].lastName"]`);

  expect(await lastName.inputValue()).toBe("Cheesemuffin");
  await page.getByRole("button", { name: "Remove Participant 1" }).click();
  expect(await lastName.inputValue()).toBe("");
});
