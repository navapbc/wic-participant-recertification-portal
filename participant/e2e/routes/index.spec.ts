// index.spec.ts - tests for the index page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("index has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/gallatin/recertify");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/Start your recertification for Montana WIC/);
  await expect(page).toHaveScreenshot();
});

// This page shouldn't set cookies
test("the index page sets no cookies", async ({ page }) => {
  await page.goto("/gallatin/recertify");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
});
