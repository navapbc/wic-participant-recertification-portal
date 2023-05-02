// routing tests
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  fillParticipantForm,
  fillCountForm,
  fillChangesForm,
  fillNameForm,
  fillUploadForm,
  fillContactForm,
} from "../helpers/formFillers";
import type { Participant } from "~/types";
import { readFileSync } from "fs";

const participantData: Participant = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Delightful",
  lastName: "Cheesemuffin",
  adjunctive: "no",
  relationship: "child",
};

for (const routeOK of ["/", "/about", "/name"]) {
  test(`without forms filled, can request ${routeOK}`, async ({ page }) => {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  });
}

test(`with name form filled, can request expected routes`, async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  for (const routeOK of ["/", "/about", "/name", "/count", "/details"]) {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  }
});

test(`with name and details forms filled, can request expected routes`, async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  for (const routeOK of ["/", "/about", "/name", "/details", "/changes"]) {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  }
});

test(`with name, details, changes forms filled, can request expected routes`, async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "yes", "yes", "/gallatin/recertify/upload");
  for (const routeOK of [
    "/",
    "/about",
    "/name",
    "/details",
    "/changes",
    "/upload",
  ]) {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  }
});

test(`with name, details, changes, upload forms filled, can request expected routes`, async ({
  page,
}) => {
  const formFile = {
    name: "test-img.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("/srv/fixtures/fns-stock-produce-shopper.jpg"),
  };

  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "yes", "yes", "/gallatin/recertify/upload");
  await fillUploadForm(page, formFile, "/gallatin/recertify/contact");
  for (const routeOK of [
    "/",
    "/about",
    "/name",
    "/details",
    "/changes",
    "/upload",
    "/contact",
  ]) {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  }
});

test(`with name, details, changes, upload, contact forms filled, can request expected routes`, async ({
  page,
}) => {
  const formFile = {
    name: "test-img.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("/srv/fixtures/fns-stock-produce-shopper.jpg"),
  };
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 1, "/gallatin/recertify/details?count=1");
  await fillParticipantForm(page, participantData, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");
  await fillChangesForm(page, "yes", "yes", "/gallatin/recertify/upload");
  await fillUploadForm(page, formFile, "/gallatin/recertify/contact");
  await fillContactForm(
    page,
    "1234567890",
    "Example Comments",
    "/gallatin/recertify/review"
  );
  for (const routeOK of [
    "/",
    "/about",
    "/name",
    "/details",
    "/changes",
    "/upload",
    "/contact",
    "/review",
  ]) {
    await page.goto(`/missoula/recertify${routeOK}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(`/missoula/recertify${routeOK}`);
  }
});
