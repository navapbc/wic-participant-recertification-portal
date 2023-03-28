// about.spec.ts - tests for the about page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("about has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/about");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/gallatin/recertify/about");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/How it works/);
  await expect(page).toHaveScreenshot();
});

// This page shouldn't set cookies
test("the about page sets no cookies", async ({ page }) => {
  await page.goto("/gallatin/recertify/about");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
});

test("clicking the continue button should take you to /name", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/about");

  // Click the get started link (button).
  await page.getByRole("link", { name: "Continue" }).click();

  // Expects the URL to contain /name.
  await expect(page).toHaveURL(/name/);
});
