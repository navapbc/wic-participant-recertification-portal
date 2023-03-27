import type { ReactElement } from "react";
import { Link as RemixLink } from "@remix-run/react";
import type { LinkProps as RemixLinkProps } from "@remix-run/react";
import { Link as USWDSLink } from "@trussworks/react-uswds";
import type { CustomLinkProps as USWDSLinkProps } from "@trussworks/react-uswds/lib/components/Link/Link";

export type ButtonLinkProps = Omit<USWDSLinkProps<RemixLinkProps>, "asCustom">;

export const ButtonLink = (props: ButtonLinkProps): ReactElement => {
  const { className = "", variant = "unstyled", to, children, ...rest } = props;
  return (
    <USWDSLink
      asCustom={RemixLink}
      className={`usa-button ${className}`.trim()}
      variant={variant}
      to={to}
      {...rest}
    >
      {children}
    </USWDSLink>
  );
};
