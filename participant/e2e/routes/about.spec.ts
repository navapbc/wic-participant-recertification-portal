// about.spec.ts - tests for the about page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("about has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/about");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/about");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/How it works/);
  await expect(page).toHaveScreenshot();
});

// This page shouldn't set cookies
test("the about page sets no cookies", async ({ page }) => {
  await page.goto("/about");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
});
