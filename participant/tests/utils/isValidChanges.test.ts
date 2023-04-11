import { createForm } from "tests/helpers/setup";
import type { FormObject } from "tests/helpers/setup";
import { changesSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const changeForm = createForm({
  idChange: "yes",
  addressChange: "no",
});

const changesValidator = withZod(changesSchema);

it("should be undefined error if all requirements are met", async () => {
  const validationResult = await changesValidator.validate(changeForm);
  expect(validationResult.error).toBeUndefined();
});

it("should have a parsed changes object if all requirements are met", async () => {
  const validationResult = await changesValidator.validate(changeForm);
  expect(validationResult.data).toStrictEqual({
    idChange: "yes",
    addressChange: "no",
  });
});

it("should have an error if a field is missing", async () => {
  const validationResult = await changesValidator.validate(
    createForm({ addressChange: "yes" } as FormObject)
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    idChange: "Required",
  });
});
