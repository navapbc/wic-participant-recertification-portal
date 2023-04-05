// changes.spec.ts - tests for the changes page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { parseSubmissionID, validateCookie } from "../helpers/cookies";
import { parse } from "querystring";

test("changes has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/changes");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await page.goto("/gallatin/recertify/changes");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/Household changes/);
  await expect(page).toHaveScreenshot();
});

// This page should set a cookie
test("the changes page sets a cookie", async ({ page }) => {
  await page.goto("/gallatin/recertify/changes");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(1);
  await validateCookie(cookies[0]);
});

test(`the changes form submits a POST request, and on return to the page,
      a GET request that repopulates the form`, async ({ page }) => {
  await page.goto("/gallatin/recertify/changes");
  const cookies = await page.context().cookies();
  const submissionID = await parseSubmissionID(cookies[0]);
  // Fill in the form with basic answers
  const idChangeYesInput = page
    .getByRole("group", {
      name: "Have you or any WIC participants in your household experienced any of these situations in the past year?",
    })
    .getByText("Yes");
  await idChangeYesInput.click();
  const addressYesInput = page
    .getByRole("group", { name: "Have you moved in the past year?" })
    .getByText("Yes");
  await addressYesInput.click();

  // Test that the screenshot for the filled out form matches
  await expect(page).toHaveScreenshot({ fullPage: true });

  // Catch the POST request to the API with the form data while we click "Continue"
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "changes?_data=routes%2F%24localAgency%2Frecertify%2Fchanges"
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
    __rvfInternalFormId: "changesForm",
    idChange: "yes",
    addressChange: "yes",
  });

  // Check that we've moved to the Upload page based on our changes
  await expect(page).toHaveURL("/gallatin/recertify/upload");

  // Capture the GET request when we load the /eligibility page again by clicking "Back"
  const [getRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "changes?_data=routes%2F%24localAgency%2Frecertify%2Fchanges"
          ) && response.status() === 200,
      { timeout: 2000 }
    ),
    await page.goBack(),
  ]);
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  const getData = await getRequest.json();
  expect(getRequest.request().method()).toBe("GET");
  expect(getData).toMatchObject({
    __rvfInternalFormDefaults_changesForm: {
      idChange: "yes",
      addressChange: "yes",
    },
    submissionID: submissionID,
  });
  await expect(page).toHaveScreenshot({ fullPage: true });

  // This is not verifying Playwright checked the boxes, but that the form repopulates
  // from the database record created by submitting the form
  await expect(
    page
      .getByRole("group", {
        name: "Have you or any WIC participants in your household experienced any of these situations in the past year?",
      })
      .getByText("Yes")
  ).toBeChecked();
  await expect(
    page
      .getByRole("group", {
        name: "Have you moved in the past year?",
      })
      .getByText("Yes")
  ).toBeChecked();
});
