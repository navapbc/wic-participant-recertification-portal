/* eslint jsx-a11y/anchor-has-content: "off" */
// The anchors generated SHOULD get interpolated with text (obviating the error)
import type { ReactElement } from "react";

import { Trans, useTranslation } from "react-i18next";

export type TransLinkProps = {
  i18nTextKey: string;
  i18nLinkKey: string;
};

export const TransLinks = (props: TransLinkProps): ReactElement => {
  const { i18nTextKey, i18nLinkKey } = props;
  const { t } = useTranslation();
  const linkArray: Array<string> = t(i18nLinkKey, { returnObjects: true });
  const linkAnchors: ReactElement[] = linkArray.map((link: string) => {
    if (/^\//.test(link)) {
      return (
        <a href={link} className="usa-link" key={linkArray.indexOf(link)}></a>
      );
    } else {
      return (
        <a
          href={link}
          className="usa-link usa-link--external"
          target="_blank"
          rel="noopener noreferrer"
          key={linkArray.indexOf(link)}
        ></a>
      );
    }
  });
  return <Trans i18nKey={i18nTextKey} components={linkAnchors} />;
};

export default TransLinks;
