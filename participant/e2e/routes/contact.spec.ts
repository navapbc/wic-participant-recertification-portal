// contact.spec.ts - tests for the contact page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { parseSubmissionID, validateCookie } from "../helpers/cookies";
import { parse } from "querystring";

test("contact has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/contact");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/gallatin/recertify/contact");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/Additional information/);
  await expect(page).toHaveScreenshot({ maxDiffPixels: 50 });
});

// This page should set a cookie
test("the contact page sets a cookie", async ({ page }) => {
  await page.goto("/gallatin/recertify/contact");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(1);
  await validateCookie(cookies[0]);
});

test(`the contact form submits a POST request, and on return to the page,
      a GET request that repopulates the form`, async ({ page }) => {
  await page.goto("/gallatin/recertify/contact");
  const cookies = await page.context().cookies();
  const submissionID = await parseSubmissionID(cookies[0]);

  // Fill in the form with basic answers and test that the screenshot for the filled out form matches
  await page.getByTestId("textInput").fill("1234563432");
  await page.getByTestId("textarea").fill("Test");
  await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixels: 50 });

  // Catch the POST request to the API with the form data while we click "Continue"
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "contact?_data=routes%2F%24localAgency%2Frecertify%2Fcontact"
          ) && response.status() === 204,
      { timeout: 2000 }
    ),
    await page.getByTestId("button").click(),
  ]);

  // Test that the submitted JSON matches the form state
  const postedData = postRequest.request().postData() || "";
  const parsedPostData = parse(postedData);
  expect(postRequest.request().method()).toBe("POST");
  expect(parsedPostData).toMatchObject({
    __rvfInternalFormId: "contactForm",
    phoneNumber: "1234563432",
    additionalInfo: "Test",
  });

  await expect(page).toHaveURL("/gallatin/recertify/review");

  // Capture the GET request when we load the /contact page again by clicking "Back"
  const [getRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "contact?_data=routes%2F%24localAgency%2Frecertify%2Fcontact"
          ) && response.status() === 200,
      { timeout: 2000 }
    ),
    await page.goBack(),
  ]);
  await expect(page).toHaveURL("/gallatin/recertify/contact");
  const getData = await getRequest.json();
  expect(getRequest.request().method()).toBe("GET");
  expect(getData).toMatchObject({
    __rvfInternalFormDefaults_contactForm: {
      phoneNumber: "1234563432",
      additionalInfo: "Test",
    },
    submissionID: submissionID,
  });
  await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixels: 50 });

  // This is not verifying Playwright checked the boxes, but that the form repopulates
  // from the database record created by submitting the form
  expect(await page.getByTestId("textInput").inputValue()).toBe("1234563432");
  expect(await page.getByTestId("textarea").inputValue()).toBe("Test");
});
