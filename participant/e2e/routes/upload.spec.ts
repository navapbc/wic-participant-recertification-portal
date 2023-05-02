// upload.spec.ts - tests for the upload page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "fs";
import imgGen from "js-image-generator";
import { fileSync } from "tmp";
import {
  fillChangesForm,
  fillCountForm,
  fillNameForm,
  fillParticipantForm,
} from "../helpers/formFillers";
import type { Participant } from "~/types";

const participantData: Participant = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Delightful",
  lastName: "Cheesemuffin",
  adjunctive: "no",
  relationship: "child",
};

export const getFileFormImage = (name: string) => {
  return {
    name: name,
    mimeType: "image/jpeg",
    buffer: readFileSync("/srv/fixtures/fns-stock-produce-shopper.jpg"),
  };
};

test("upload has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  // Expect a title "to contain" a correct page title.
  await expect(page).toHaveTitle(/You need to upload documents./);
  await expect(page).toHaveScreenshot();
});

test("add one image file", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const file = getFileFormImage("test-img.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([file]);
  const imgPreview = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreview).toBeVisible();
});

test("add TWO image files", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const fileOne = getFileFormImage("test-img.jpg");
  const fileTwo = getFileFormImage("test-img-2.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([fileOne]);
  await uploadBox.setInputFiles([fileTwo]);
  const imgPreviewOne = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreviewOne).toBeVisible();
  const imgPreviewTwo = page.getByAltText("Preview for test-img-2.jpg");
  await expect(imgPreviewTwo).toBeVisible();
});

test("add TWO image files, submit, then return to see that they are previewed", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const fileOne = getFileFormImage("test-img.jpg");
  const fileTwo = getFileFormImage("test-img-2.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([fileOne]);
  await uploadBox.setInputFiles([fileTwo]);
  const imgPreviewOne = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreviewOne).toBeVisible();
  const imgPreviewTwo = page.getByAltText("Preview for test-img-2.jpg");
  await expect(imgPreviewTwo).toBeVisible();
  await page.getByTestId("button").click();
  await expect(page).toHaveURL("/gallatin/recertify/contact");
  await page.goto("/gallatin/recertify/upload", { waitUntil: "networkidle" });
  const imgPreviewOneReturn = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreviewOneReturn).toBeVisible();
  const imgPreviewTwoReturn = page.getByAltText("Preview for test-img-2.jpg");
  await expect(imgPreviewTwoReturn).toBeVisible();
});

test("try to add six image files, expect an error", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const sixFiles = [1, 2, 3, 4, 5, 6].map((value) => {
    return getFileFormImage(`test-img-${value}.jpg`);
  });
  const uploadBox = page.locator("input[type='file']");
  await Promise.all([
    sixFiles.map(async (fileObject) => {
      await uploadBox.setInputFiles([fileObject]);
    }),
  ]);
  const tooManyFiles = page.getByTestId("file-input-error");
  await expect(tooManyFiles).toBeVisible();
  expect(await tooManyFiles.textContent()).toBe(
    "You have reached the maximum number of files; please remove files before adding additional files"
  );
});

test("add TWO image files, then remove them", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const fileOne = getFileFormImage("test-img.jpg");
  const fileTwo = getFileFormImage("test-img-2.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([fileOne]);
  await uploadBox.setInputFiles([fileTwo]);
  const imgPreviewOne = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreviewOne).toBeVisible();
  const imgPreviewTwo = page.getByAltText("Preview for test-img-2.jpg");
  await expect(imgPreviewTwo).toBeVisible();
  const removeButtons = await page
    .getByRole("button", { name: "Remove" })
    .all();
  expect(removeButtons.length).toBe(2);
  const [removeImgOne, removeImgTwo] = removeButtons;
  await removeImgTwo.click();
  await expect(page.getByAltText("Preview for test-img-2.jpg")).toHaveCount(0);
  await removeImgOne.click();
  await expect(page.getByAltText("Preview for test-img.jpg")).toHaveCount(0);
});

test("max out file count", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const uploadBox = page.locator("input[type='file']");
  for (let fileNum = 0; fileNum < 5; fileNum++) {
    const fileName = `test-${fileNum}.jpg`;
    const file = getFileFormImage(fileName);
    await uploadBox.setInputFiles([file]);
    const altText = `Preview for ${fileName}`;
    await expect(page.getByAltText(altText)).toBeVisible();
  }
  const removeButtons = await page
    .getByRole("button", { name: "Remove" })
    .all();
  expect(removeButtons.length).toBe(5);
  const oneTooMany = getFileFormImage("reject-me.jpg");
  await uploadBox.setInputFiles([oneTooMany]);
  await expect(page.getByAltText("Preview for reject-me.jpg")).toHaveCount(0);
  const errorElement = page.getByTestId("file-input-error");
  expect(await errorElement.textContent()).toMatch(
    /You have reached the maximum number/
  );
});

test("a large image is rejected", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const uploadBox = page.locator("input[type='file']");
  const tmpFile = fileSync();
  imgGen.generateImage(3000, 2000, 100, function (err, image) {
    writeFileSync(tmpFile.fd, image.data);
  });
  const bigFile = {
    name: "bigFile.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync(tmpFile.name),
  };
  await uploadBox.setInputFiles([bigFile]);
  const errorElement = page.getByTestId("file-input-error");
  expect(await errorElement.textContent()).toMatch(
    /This file is over the maximum size/
  );
});

test("an unacceptable file is un-accepted", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const uploadBox = page.locator("input[type='file']");
  const badFile = {
    name: "badFile.ts",
    mimeType: "text/typescript",
    buffer: readFileSync("/srv/e2e/routes/upload.spec.ts"),
  };
  await uploadBox.setInputFiles([badFile]);
  const errorElement = page.getByTestId("file-input-error");
  expect(await errorElement.textContent()).toMatch(
    /This is not a valid file type./
  );
});

test("an unacceptable file pretending to be an image is un-accepted", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const uploadBox = page.locator("input[type='file']");
  const badFile = {
    name: "badFile.jpg",
    mimeType: "image/jpg",
    buffer: readFileSync("/srv/e2e/routes/upload.spec.ts"),
  };
  await uploadBox.setInputFiles([badFile]);
  await page
    .getByRole("button", { name: "Upload and continue", exact: true })
    .click();
  const errorElement = page.getByTestId("alert");
  expect(await errorElement.textContent()).toMatch(
    /We could not upload: badFile.jpg. Choose a PDF or an image file smaller than 5 MB./
  );
});

test("submitting with one valid image routes to /contact", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const file = getFileFormImage("test-img.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([file]);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "upload?_data=routes%2F%24localAgency%2Frecertify%2Fupload"
          ) && response.status() === 204,
      { timeout: 2000 }
    ),
    await page
      .getByRole("button", { name: "Upload and continue", exact: true })
      .click(),
  ]);

  await expect(page).toHaveURL("/gallatin/recertify/contact");
});

test("submitting with no files stays on the same page, shows error", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "upload?_data=routes%2F%24localAgency%2Frecertify%2Fupload"
          ) && response.status() === 200,
      { timeout: 2000 }
    ),
    await page
      .getByRole("button", { name: "Upload and continue", exact: true })
      .click(),
  ]);
  expect(postRequest.request().method()).toBe("POST");
  const responseData = await postRequest.json();
  expect(responseData).toMatchObject({
    acceptedUploads: [],
    rejectedUploads: [],
  });
  const alert = page.getByTestId("alert");
  expect(await alert.textContent()).toBe("Upload at least 1 file to continue.");
});

test("navigating to /upload without changes data routes back to changes", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await page.goto("/gallatin/recertify/upload", { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/gallatin/recertify/changes");
});

test("submitting a file, then clicking 'Remove File' removes it", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const fileOne = getFileFormImage("test-img.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([fileOne]);
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "upload?_data=routes%2F%24localAgency%2Frecertify%2Fupload"
          ) && response.status() === 204,
      { timeout: 2000 }
    ),
    await page
      .getByRole("button", { name: "Upload and continue", exact: true })
      .click(),
  ]);
  expect(postRequest.request().method()).toBe("POST");

  await expect(page).toHaveURL("/gallatin/recertify/contact");
  await page.goto("/gallatin/recertify/upload", { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/gallatin/recertify/upload");

  await expect(page.getByText("Previously uploaded documents")).toBeVisible();
  const previousPreview = page.getByAltText("Image preview for test-img.jpg");
  await expect(previousPreview).toHaveCount(1);
  const [getRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "upload?action=remove_file&remove=test-img.jpg&_data=routes%2F%24localAgency%2Frecertify%2Fupload"
          ) && response.status() === 204,
      { timeout: 2000 }
    ),
    await page.getByRole("button", { name: "Remove File" }).click(),
  ]);
  expect(getRequest.request().method()).toBe("GET");
  await expect(page.getByText("Previously uploaded documents")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove File" })).toHaveCount(
    0
  );
});
