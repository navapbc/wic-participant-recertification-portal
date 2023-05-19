import { z } from "zod";
import { zfd } from "zod-form-data";

const nameSchemaFactory = (idPrefix: string) => {
  return zfd.formData(
    z.object({
      [idPrefix]: z.object({
        firstName: zfd.text(
          z.string({ required_error: "Enter your first name" }).min(1)
        ),
        lastName: zfd.text(
          z.string({ required_error: "Enter your last name" }).min(1)
        ),
        preferredName: zfd.text(z.string().optional()),
      }),
    })
  );
};

export const representativeNameSchema = nameSchemaFactory("representative");

export const changesSchema = zfd.formData({
  idChange: zfd.text(
    z.enum(["yes", "no"], {
      required_error:
        "Select Yes if you or any WIC participants in your household had a name change or the ID document previously shared has expired.",
    })
  ),
  addressChange: zfd.text(
    z.enum(["yes", "no"], {
      required_error: "Select Yes if you moved in the past year.",
    })
  ),
});

export const contactSchema = zfd.formData({
  phoneNumber: zfd.text(
    z
      .string()
      .optional()
      .transform((val, ctx) => {
        if (!val) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Enter a phone number",
          });
          return z.NEVER;
        }
        const parsed = val!.replace(/[^0-9]/g, "");
        if (parsed.length != 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Enter your 10-digit phone number, with the area code first",
          });
          return z.NEVER;
        }
        return parsed;
      })
  ),
  additionalInfo: zfd.text(z.string().optional()),
});

export const countSchema = zfd.formData({
  householdSize: zfd.numeric(
    z
      .number({
        required_error:
          "Enter the number of people in your household will recertify at the next appointment",
      })
      .min(1, {
        message:
          "At least 1 member in your household must recertify to use this form",
      })
  ),
});

export const participantSchema = zfd.formData({
  participant: z.array(
    z.object({
      relationship: zfd.text(
        z.enum(["self", "child", "grandchild", "foster", "other"], {
          required_error: "Select the participant’s relationship to you.",
        })
      ),
      firstName: zfd.text(
        z.string({ required_error: "Enter a first name" }).min(1)
      ),
      lastName: zfd.text(
        z.string({ required_error: "Enter a last name" }).min(1)
      ),
      preferredName: zfd.text(z.string().optional()),

      dob: z
        .object({
          day: zfd.numeric(),
          month: zfd.numeric(),
          year: zfd.numeric(),
        })
        .superRefine((val, ctx) => {
          if (!val.year || !val.month || !val.day) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Date of birth must include a valid month, day, and year.",
            });
            return z.NEVER;
          }
          const date = new Date(val.year, val.month - 1, val.day);
          const now = new Date();
          if (date.valueOf() == undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Enter a valid date of birth",
            });
            return z.NEVER;
          }
          if (date.getMonth() != val.month - 1 || date.getDate() != val.day) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Date of birth must include a valid month, day, and year.",
            });
            return z.NEVER;
          }
          if (date.getFullYear() < now.getFullYear() - 110) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Enter a valid date of birth.",
            });
            return z.NEVER;
          }
          if (date > now) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Date of birth must be today or in the past.",
            });
            return z.NEVER;
          }
        }),
      adjunctive: zfd.text(
        z.enum(["yes", "no"], {
          required_error:
            "Select Yes if they are enrolled in any of these programs.",
        })
      ),
      tag: zfd.text().optional(),
    })
  ),
});

export const uploadSchema = zfd.formData(
  z.object({
    documents: zfd.repeatable(z.array(z.string())),
  })
);
