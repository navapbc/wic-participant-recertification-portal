import { Button } from "@trussworks/react-uswds";
import { Form } from "@remix-run/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { TextField } from "app/components/TextField";
//import type { TextFieldProps } from "app/components/TextField";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
//import { ValidatedForm } from "remix-validated-form";
//import { representativeNameSchema } from "app/utils/validation";
//import { withZod } from "@remix-validated-form/with-zod";

export default function Contact() {
    const { t } = useTranslation();
    /**  const phoneNumberProps: TextFieldProps = {
         id: "phoneNumberSize",
         type: "input",
         inputType: "tel",
         labelKey: "Contact.phoneNumber",
         required: true,
     };
     const additionalInfoProps: TextFieldProps = {
         id: "additionalInfo",
         type: "textarea",
         inputType: "text",
         labelKey: "Contact.additionalInfo.label",
         //hint: "Contact.additionalInfo.hint",
         required: false,
         labelClassName: "label-large",
     }; */
    return (
        <div>
            <h1>
                <Trans i18nKey="Contact.title" />
            </h1>
            <RequiredQuestionStatement />
            <Form>
                <TextField
                    id="phone-number"
                    inputType="tel"
                    labelKey="Contact.phoneNumber"
                    required
                    type="input"
                    labelClassName="usa-label--large"
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
            </Form>
        </div>
    );
}
