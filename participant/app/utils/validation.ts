import { z } from "zod";
import { zfd } from "zod-form-data";

const nameSchemaFactory = (idPrefix: string) => {
  /* eslint-disable-rule @typescript-eslint/no-unused-vars
     I do not understand why eslint thinks we're not using these vars
  */
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
