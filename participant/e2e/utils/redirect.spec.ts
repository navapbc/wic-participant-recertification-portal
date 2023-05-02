// index.spec.ts - tests for the index page
import { test, expect } from "@playwright/test";
import { validateCookie } from "../helpers/cookies";

test("routes directly to a valid clinic url", async ({ page }) => {
  await page.goto("/gallatin/recertify");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveURL("/gallatin/recertify");
});

test("an invalid clinic sends the user to the base URL for the first clinic", async ({
  page,
}) => {
  await page.goto("/fillory/recertify");
  await expect(page).toHaveURL("/gallatin/recertify");
});

test("navigating to the root sends the user to the base URL for the first clinic", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/gallatin/recertify");
});

test("a valid clinic but invalid path redirect to the clinic's base URL", async ({
  page,
}) => {
  await page.goto("/missoula/recertify/somewhere/over/the/rainbow");
  await expect(page).toHaveURL("/missoula/recertify");
});

test("a visit to the index page with no bogus cookies lands successfully", async ({
  page,
}) => {
  await page.goto("/missoula/recertify");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(1);
  await validateCookie(cookies[0]);
  await expect(page).toHaveURL("/missoula/recertify");
});
