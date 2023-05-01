import { Trans } from "react-i18next";
import type { ReactElement } from "react";
import type { i18nKey } from "~/types";
import { ButtonLink } from "./ButtonLink";
export type ReviewSectionProps = {
  editHref?: string;
  editButtonKey: i18nKey;
  headingKey: i18nKey;
  children: ReactElement;
};

export const ReviewSection = (props: ReviewSectionProps): ReactElement => {
  const { editHref, headingKey, editButtonKey, children } = props;
  return (
    <div className="border-bottom-1px review-section">
      <h2>
        <Trans i18nKey={headingKey} />
        {editHref && (
          <div className="float-right">
            <ButtonLink
              to={editHref}
              className="usa-button--small display-block usa-button--unstyled margin-top-1"
            >
              <Trans i18nKey={editButtonKey} />
            </ButtonLink>
          </div>
        )}
      </h2>
      {children}
    </div>
  );
};
