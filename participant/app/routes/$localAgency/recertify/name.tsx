import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { NameInput } from "~/components/NameInput";
import type { NameInputProps } from "~/components/NameInput";
import { Form } from "@remix-run/react";

export default function Index() {
  const nameInputProps: NameInputProps = {
    id: "representative",
    nameKey: "NameInput",
    legendStyle: "srOnly",
    legal: true,
    preferred: true,
  };

  return (
    <div>
      <h1>
        <Trans i18nKey="Name.title" />
      </h1>
      <Form>
        <NameInput {...nameInputProps} />
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Name.button" />
        </Button>
      </Form>
    </div>
  );
}
