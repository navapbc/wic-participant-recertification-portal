// upload.spec.ts - tests for the upload page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "fs";
import imgGen from "js-image-generator";
import { fileSync } from "tmp";
import { fillChangesForm } from "../helpers/formFillers";

const getFileFormImage = (name: string) => {
  return {
    name: name,
    mimeType: "image/jpeg",
    buffer: readFileSync("/srv/fixtures/fns-stock-produce-shopper.jpg"),
  };
};

test("upload has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  // Expect a title "to contain" a correct page title.
  await expect(page).toHaveTitle(/You need to upload documents./);
  await expect(page).toHaveScreenshot();
});

test("add one image file", async ({ page }) => {
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const file = getFileFormImage("test-img.jpg");
  const uploadBox = page.locator("input[type='file']");
  await uploadBox.setInputFiles([file]);
  const imgPreview = page.getByAltText("Preview for test-img.jpg");
  await expect(imgPreview).toBeVisible();
});

test("add TWO image files", async ({ page }) => {
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

test("add TWO image files, then remove them", async ({ page }) => {
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
  await fillChangesForm(page, "Yes", "Yes", "/gallatin/recertify/upload");
  const uploadBox = page.locator("input[type='file']");
  for (let fileNum = 0; fileNum < 20; fileNum++) {
    const fileName = `test-${fileNum}.jpg`;
    const file = getFileFormImage(fileName);
    await uploadBox.setInputFiles([file]);
    const altText = `Preview for ${fileName}`;
    await expect(page.getByAltText(altText)).toBeVisible();
  }
  const removeButtons = await page
    .getByRole("button", { name: "Remove" })
    .all();
  expect(removeButtons.length).toBe(20);
  const oneTooMany = getFileFormImage("reject-me.jpg");
  await uploadBox.setInputFiles([oneTooMany]);
  await expect(page.getByAltText("Preview for reject-me.jpg")).toHaveCount(0);
  const errorElement = page.getByTestId("file-input-error");
  expect(await errorElement.textContent()).toMatch(
    /You have reached the maximum number/
  );
});

test("a large image is rejected", async ({ page }) => {
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
