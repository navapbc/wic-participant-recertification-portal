import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Participant } from "~/types";
import { capitalize } from "lodash";
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

export async function fillParticipantForm(
  page: Page,
  participant: Participant,
  index: number = 1
): Promise<void> {
  await page.goto("/gallatin/recertify/details", { waitUntil: "networkidle" });
  await page
    .getByText(capitalize(participant.relationship), { exact: true })
    .nth(index)
    .click();
  const firstName = page.locator(`[id="participant[${index}].firstName"]`);
  await firstName.fill(participant.firstName);
  const lastName = page.locator(`[id="participant[${index}].lastName"]`);
  await lastName.fill(participant.lastName);
  const dobMonth = page.locator(
    `input[name="participant[${index}].dob.month"]`
  );
  await dobMonth.fill(participant.dob.month.toString());
  const dobDay = page.locator(`input[name="participant[${index}].dob.day"]`);
  await dobDay.fill(participant.dob.day.toString());
  const dobYear = page.locator(`input[name="participant[${index}].dob.year"]`);
  await dobYear.fill(participant.dob.year.toString());
  await page.getByText(capitalize(participant.adjunctive)).nth(index).click();
}

export async function fillCountForm(
  page: Page,
  count: number,
  expectedRoute: string
): Promise<void> {
  await page.goto("/gallatin/recertify/count", { waitUntil: "networkidle" });
  await page.getByTestId("textInput").fill(count.toString());
  await page.getByTestId("button").click();
  await expect(page).toHaveURL(expectedRoute);
}

export async function fillContactForm(
  page: Page,
  phone: string,
  additionalComments: string,
  expectedRoute: string
): Promise<void> {
  await page.goto("/gallatin/recertify/contact", { waitUntil: "networkidle" });
  await page.getByTestId("textInput").fill(phone);
  await page.getByTestId("textarea").fill(additionalComments);
  await page.getByTestId("button").click();
  await expect(page).toHaveURL(expectedRoute);
}

export async function fillNameForm(
  page: Page,
  firstName: string,
  lastName: string,
  expectedRoute: string
): Promise<void> {
  await page.goto("/gallatin/recertify/name", { waitUntil: "networkidle" });
  await page
    .getByLabel("First name *Legally as it appears on an ID document.")
    .fill(firstName);
  await page
    .getByLabel("Last name *Legally as it appears on an ID document.")
    .fill(lastName);
  await page.getByTestId("button").click();
  await expect(page).toHaveURL(expectedRoute);
}

export async function fillUploadForm(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
  expectedRoute: string
): Promise<void> {
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([file]);
  await page
    .getByRole("button", { name: "Upload and continue", exact: true })
    .click();
  await expect(page).toHaveURL(expectedRoute);
}
