import { z } from "zod";
import { zfd } from "zod-form-data";

const nameSchemaFactory = (idPrefix: string) => {
  const firstNameKey = `${idPrefix}-firstName`;
  const lastNameKey = `${idPrefix}-lastName`;
  const preferredNameKey = `${idPrefix}-preferredName`;
  return zfd.formData({
    [firstNameKey]: zfd.text(
      z.string().min(1, { message: "First name is required" })
    ),
    [lastNameKey]: zfd.text(
      z.string().min(1, { message: "Last name is required" })
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
