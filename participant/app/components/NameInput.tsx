import type { ReactElement } from "react";
import { TextField } from "app/components/TextField";
import { Fieldset } from "@trussworks/react-uswds";
import type { i18nKey, legendStyleType } from "~/types";

import { Trans, useTranslation } from "react-i18next";

export type NameInputProps = {
  id: string;
  nameKey: i18nKey;
  legendStyle?: legendStyleType;
  legal?: boolean;
  preferred?: boolean;
  keyBase: string;
};

export const NameInput = (props: NameInputProps): ReactElement => {
  const {
    id,
    nameKey,
    legendStyle = "srOnly",
    preferred,
    legal = true,
    keyBase,
  } = props;
  const { t } = useTranslation();
  const hint = legal ? (
    <div>
      <Trans i18nKey={`${nameKey}.legal`} />
    </div>
  ) : (
    <></>
  );
  return (
    <Fieldset
      legend={t(`${nameKey}.legend`)}
      legendStyle={legendStyle}
      key={keyBase}
    >
      <TextField
        id={`${id}.firstName`}
        labelKey={`${nameKey}.firstname`}
        inputType="text"
        hint={hint}
        required={true}
        key={`${keyBase}-firstName`}
      />
      <TextField
        id={`${id}.lastName`}
        labelKey={`${nameKey}.lastname`}
        inputType="text"
        hint={hint}
        required={true}
        key={`${keyBase}-lastName`}
      />
      {preferred && t(`${nameKey}.preferred`) ? (
        <TextField
          id={`${id}.preferredName`}
          labelKey={t(`${nameKey}.preferred`)}
          inputType="text"
          key={`${keyBase}-preferredName`}
        />
      ) : (
        ""
      )}
    </Fieldset>
  );
};
