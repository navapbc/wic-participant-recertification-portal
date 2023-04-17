import { z } from "zod";
import { zfd } from "zod-form-data";

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
  idChange: zfd.text(z.enum(["yes", "no"])),
  addressChange: zfd.text(z.enum(["yes", "no"])),
});

export const countSchema = zfd.formData({
  householdSize: zfd.numeric(
    z.number().min(1, { message: "You must recertify for at least one person" })
  ),
});
