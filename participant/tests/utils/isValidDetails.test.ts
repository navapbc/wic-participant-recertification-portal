import type { FormObject } from "tests/helpers/setup";
import { participantSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import { omit } from "lodash";
import { serialize } from "object-to-formdata";
const participantData = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Bamboozled",
  lastName: "Cheesemuffin",
  adjunctive: "no",

  relationship: "grandchild",
};
const participantForm = serialize(
  { participant: [participantData] },
  { indices: true }
);
const participantValidator = withZod(participantSchema);

it("should be undefined error if all requirements are met", async () => {
  const validationResult = await participantValidator.validate(participantForm);
  expect(validationResult.error).toBeUndefined();
});

it("should have a parsed changes object if all requirements are met", async () => {
  const validationResult = await participantValidator.validate(participantForm);
  expect(validationResult.data).toStrictEqual({
    participant: [participantData],
  });
});

it("should have an error if relationship is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["relationship"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].relationship":
      "Select the participant’s relationship to you.",
  });
});

it("should have an error if firstName is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["firstName"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].firstName": "Enter a first name",
  });
});

it("should have an error if lastName is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["lastName"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].lastName": "Enter a last name",
  });
});

it("should have an error if dob.month is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["dob.month"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.month": "Required",
  });
});

it("should have an error if dob.month is incorrect", async () => {
  const mungedMonth = omit(participantData, ["dob.month"]);
  mungedMonth.dob!.month = 99;
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [mungedMonth],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.month":
      "Date of birth must include a valid month, day, and year.",
  });
});

it("should have an error if dob.day is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["dob.day"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.day": "Required",
  });
});

it("should have an error if dob.day is incorrect", async () => {
  const mungedDay = omit(participantData, ["dob.day"]);
  mungedDay.dob!.day = 99;
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [mungedDay],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.day":
      "Date of birth must include a valid month, day, and year.",
  });
});

it("should have an error if dob.year is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["dob.year"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.year": "Required",
  });
});

it("should have an error if dob.year is too early", async () => {
  const mungedYear = omit(participantData, ["dob.year"]);
  mungedYear.dob!.year = 1909;
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [mungedYear],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.year": "Enter a valid date of birth.",
  });
});

it("should have an error if dob.year is back to the future", async () => {
  const mungedYear = omit(participantData, ["dob.year"]);
  mungedYear.dob!.year = 3000;
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [mungedYear],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].dob.year": "Date of birth must be today or in the past.",
  });
});

it("should have an error if adjunctive is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["adjunctive"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.data).toBeUndefined();
  expect(validationResult.error?.fieldErrors).toStrictEqual({
    "participant[0].adjunctive":
      "Select Yes if they are enrolled in any of these programs.",
  });
});

it("should have NO error if tag is missing", async () => {
  const validationResult = await participantValidator.validate(
    serialize(
      {
        participant: [omit(participantData, ["tag"])],
      },
      { indices: true }
    )
  );
  expect(validationResult.error).toBeUndefined();
});
