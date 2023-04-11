import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { TextField } from "app/components/TextField";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import { ValidatedForm } from "remix-validated-form";
import { contactSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";

const contactValidator = withZod(contactSchema);

export default function Contact() {
  return (
    <div>
      <h1>
        <Trans i18nKey="Contact.title" />
      </h1>
      <RequiredQuestionStatement />
      <ValidatedForm 
        validator={contactValidator}
        id="contactForm"
        method="post"
      >
        <TextField
          id="phone-number"
          inputType="tel"
          labelKey="Contact.phoneNumber"
          required
          type="input"
          labelClassName="usa-label--large"
          className="width-card-lg"
        />
        <TextField
          id="additional-ifno"
          inputType="text"
          labelKey="Contact.additionalInfo.label"
          labelClassName="usa-label--large"
          hint={<Trans i18nKey="Contact.additionalInfo.hint" />}
          type="textarea"
        />

        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Contact.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
