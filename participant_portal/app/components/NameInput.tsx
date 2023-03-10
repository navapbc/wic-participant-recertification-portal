import type { ReactElement } from "react";
import { TextField } from "app/components/TextField";
import { Fieldset } from "@trussworks/react-uswds";
import type { i18nKey } from "~/types";

import { Trans, useTranslation } from "react-i18next";

export type NameInputProps = {
  id: string;
  firstNameKey: i18nKey;
  lastNameKey: i18nKey;
  legalKey: i18nKey;
  legendKey: i18nKey;
  legendStyle?: "default" | "large" | "srOnly" | undefined;
  preferred?: boolean;
  preferredKey?: i18nKey;
};

export const NameInput = (props: NameInputProps): ReactElement => {
  const {
    id,
    firstNameKey,
    lastNameKey,
    legalKey,
    legendKey,
    legendStyle = "srOnly",
    preferred,
    preferredKey,
  } = props;
  const { t } = useTranslation();
  const hint = (
    <div>
      <Trans i18nKey={legalKey} />
    </div>
  );
  return (
    <Fieldset legend={t(legendKey)} legendStyle={legendStyle}>
      <TextField
        id={`firstName-${id}`}
        labelKey={firstNameKey}
        inputType="text"
        hint={hint}
        required={true}
      />
      <TextField
        id={`lastName-${id}`}
        labelKey={lastNameKey}
        inputType="text"
        hint={hint}
        required={true}
      />
      {preferred && preferredKey ? (
        <TextField
          id={`preferred-${id}`}
          labelKey={preferredKey}
          inputType="text"
        />
      ) : (
        ""
      )}
    </Fieldset>
  );
};
