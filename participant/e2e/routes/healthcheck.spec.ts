import { test, expect } from "@playwright/test";

test(`the healthcheck returns OK`, async ({ page }) => {
  await page.goto("/healthcheck");
  expect(await page.locator("html").textContent()).toBe("OK");
});
