import { z } from "zod";
import { zfd } from "zod-form-data";
import errorMap from "zod/lib/locales/en";

const nameSchemaFactory = (idPrefix: string) => {
  const firstNameKey = `${idPrefix}-firstName`;
  const lastNameKey = `${idPrefix}-lastName`;
  const preferredNameKey = `${idPrefix}-preferredName`;
  return zfd.formData({
    [firstNameKey]: zfd.text(
      z.string({ required_error: "Enter your first name" }).min(1)
    ),
    [lastNameKey]: zfd.text(
      z.string({ required_error: "Enter your last name" }).min(1)
    ),
    [preferredNameKey]: zfd.text(z.string().optional()),
  });
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

//TODO Update this with the proper validation
export const householdDetailsSchema = zfd.formData({
  householdSize: zfd.numeric(),
});
