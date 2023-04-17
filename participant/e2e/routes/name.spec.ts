// name.spec.ts - tests for the name page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { parseSubmissionID, validateCookie } from "../helpers/cookies";
import { parse } from "querystring";

test("name has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/name");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/gallatin/recertify/name");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/What's your name?/);
  await expect(page).toHaveScreenshot();
});

// This page should set a cookie
test("the name page sets a cookie", async ({ page }) => {
  await page.goto("/gallatin/recertify/name");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(1);
  await validateCookie(cookies[0]);
});

test(`the name form submits a POST request, and on return to the page,
      a GET request that repopulates the form`, async ({ page }) => {
  await page.goto("/gallatin/recertify/name");
  const cookies = await page.context().cookies();
  const submissionID = await parseSubmissionID(cookies[0]);

  // Fill in the form with basic answers and test that the screenshot for the filled out form matches
  await page
    .getByLabel("First name *Legally as it appears on an ID document.")
    .fill("Alice");
  await page
    .getByLabel("Last name *Legally as it appears on an ID document.")
    .fill("Zor");
  await expect(page).toHaveScreenshot({ fullPage: true });

  // Catch the POST request to the API with the form data while we click "Continue"
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes("name?_data=routes%2F%24localAgency%2Frecertify%2Fname") &&
        response.status() === 204,
      { timeout: 2000 }
    ),
    await page.getByTestId("button").click(),
  ]);

  // Test that the submitted JSON matches the form state
  const postedData = postRequest.request().postData() || "";
  const parsedPostData = parse(postedData);
  expect(postRequest.request().method()).toBe("POST");
  expect(parsedPostData).toMatchObject({
    __rvfInternalFormId: "representativeNameForm",
    "representative-firstName": "Alice",
    "representative-lastName": "Zor",
  });

  // Check that we've moved to the Count page based on our name
  await expect(page).toHaveURL("/gallatin/recertify/count");

  // Capture the GET request when we load the /name page again by clicking "Back"
  const [getRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes("name?_data=routes%2F%24localAgency%2Frecertify%2Fname") &&
        response.status() === 200,
      { timeout: 2000 }
    ),
    await page.goBack(),
  ]);
  await expect(page).toHaveURL("/gallatin/recertify/name");
  const getData = await getRequest.json();
  expect(getRequest.request().method()).toBe("GET");
  expect(getData).toMatchObject({
    __rvfInternalFormDefaults_nameForm: {
      "representative-firstName": "Alice",
      "representative-lastName": "Zor",
    },
    submissionID: submissionID,
  });
  await expect(page).toHaveScreenshot({ fullPage: true });

  // This is not verifying Playwright checked the boxes, but that the form repopulates
  // from the database record created by submitting the form
  expect(
    await page
      .getByLabel("First name *Legally as it appears on an ID document.")
      .fill("Alice")
  );
  expect(
    await page
      .getByLabel("Last name *Legally as it appears on an ID document.")
      .fill("Zor")
  );
});
