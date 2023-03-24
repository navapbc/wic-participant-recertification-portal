import { Trans } from "react-i18next";
import { ReactElement } from "react";

export const RequiredQuestionStatement = (): ReactElement => {
  return (
    <p>
      <Trans i18nKey="asterisk" /> (
      <abbr className="usa-hint usa-hint--required">*</abbr>).
    </p>
  );
};

export default RequiredQuestionStatement;
