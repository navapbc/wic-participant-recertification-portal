import type { Cookie } from "@playwright/test";
import { expect } from "@playwright/test";
import { validate } from "uuid";

export const validateCookie: Function = async (cookie: Cookie) => {
  await expect(cookie.name).toBe("prp-recertification-form");
  await expect(validate(await parseSubmissionID(cookie))).toBe(true);
};

export const parseSubmissionID: Function = async (cookie: Cookie) => {
  return JSON.parse(
    Buffer.from(cookie.value, "base64").toString("utf8").slice(0, -2)
  ).submissionID;
};
