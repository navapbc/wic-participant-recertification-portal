import { createForm } from "tests/helpers/setup";
import type { FormObject } from "tests/helpers/setup";
import { countSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const householdSizeForm = createForm({
  householdSize: 2,
});

const countValidator = withZod(countSchema);

it("should be undefined error if all requirements are met", async () => {
  const validationResult = await countValidator.validate(householdSizeForm);
  expect(validationResult.error).toBeUndefined();
});

it("should have a parsed contact object if all requirements are met", async () => {
  const validationResult = await countValidator.validate(householdSizeForm);
  expect(validationResult.data).toStrictEqual({
    householdSize: 2,
  });
});

it("should have an error if a field is missing", async () => {
  const validationResult = await countValidator.validate(
    createForm({ householdSize: "" } as FormObject)
  );
  expect(validationResult.data).toBeUndefined();
});
