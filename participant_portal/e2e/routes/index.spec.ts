// index.spec.ts - tests for the index page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("index has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/Shoegaze Stack/);
  await expect(page).toHaveScreenshot();
});

test("Open the README link", async ({ page }) => {
  await page.goto("/");
  const readmeLink = page.getByRole("link", { name: "Open the README" });
  await expect(readmeLink).toBeVisible();
  await expect(readmeLink).toHaveAttribute("href", "../README.md");
});

// This page shouldn't set cookies
test("the index page sets no cookies", async ({ page }) => {
  await page.goto("/");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
});
