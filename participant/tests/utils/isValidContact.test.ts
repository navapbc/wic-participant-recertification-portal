import { createForm } from "tests/helpers/setup";
import type { FormObject } from "tests/helpers/setup";
import { contactSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const contactForm = createForm({
  phoneNumber: "1234563432",
  additionalInfo: "Test",
});

const contactValidator = withZod(contactSchema);

it("should be undefined error if all requirements are met", async () => {
  const validationResult = await contactValidator.validate(contactForm);
  expect(validationResult.error).toBeUndefined();
});

it("should have a parsed contact object if all requirements are met", async () => {
  const validationResult = await contactValidator.validate(contactForm);
  expect(validationResult.data).toStrictEqual({
    phoneNumber: "1234563432",
    additionalInfo: "Test",
  });
});

it("should have an error if a field is missing", async () => {
  const validationResult = await contactValidator.validate(
    createForm({ phoneNumber: "", additionalInfo: "Test"} as FormObject)
  );
  expect(validationResult.data).toBeUndefined()
});
