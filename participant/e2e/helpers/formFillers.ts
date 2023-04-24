import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function fillChangesForm(
  page: Page,
  idChange: string,
  addressChange: string,
  expectedRoute: string
): Promise<void> {
  await page.goto("/gallatin/recertify/changes", { waitUntil: "networkidle" });
  const idChangeInput = page
    .getByRole("group", {
      name: "Have you or any WIC participants in your household experienced any of these situations in the past year?",
    })
    .getByText(idChange);
  await idChangeInput.click();
  const addressChangeInput = page
    .getByRole("group", { name: "Have you moved in the past year?" })
    .getByText(addressChange);
  await addressChangeInput.click();

  const submitButton = page.getByTestId("button");
  await submitButton.click();
  await expect(page).toHaveURL(expectedRoute);
}
