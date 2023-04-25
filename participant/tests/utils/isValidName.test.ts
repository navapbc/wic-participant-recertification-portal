import { createForm } from "tests/helpers/setup";
import type { FormObject } from "tests/helpers/setup";
import { representativeNameSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
const representativeNameForm = createForm({
  "representative.firstName": "Alice",
  "representative.lastName": "Zor",
  "representative.preferredName": "Ali",
});

const representativeNameValidator = withZod(representativeNameSchema);

it("should be undefined error if all requirements are met", async () => {
  const validationResult = await representativeNameValidator.validate(
    representativeNameForm
  );
  expect(validationResult.error).toBeUndefined();
});

it("should have a parsed changes object if all requirements are met", async () => {
  const validationResult = await representativeNameValidator.validate(
    representativeNameForm
  );
  expect(validationResult.data).toStrictEqual({
    representative: {
      firstName: "Alice",
      lastName: "Zor",
      preferredName: "Ali",
    },
  });
});

it("should have an error if a field is missing", async () => {
  const validationResult = await representativeNameValidator.validate(
    createForm({
      "representative.firstName": "",
      "representative.lastName": "",
      "representative.preferredName": "Ali",
    } as FormObject)
  );
  expect(validationResult.data).toBeUndefined();
});
