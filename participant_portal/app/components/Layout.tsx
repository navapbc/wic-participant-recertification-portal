import { Trans } from "react-i18next";
import type { ReactElement } from "react";
import { Alert, Title, Header, Footer } from "@trussworks/react-uswds";
import TransLinks from "./TransLinks";

export type LayoutProps = {
  children: ReactElement;
  demoMode?: string;
  missingData?: string;
};

const Layout = ({
  children,
  demoMode,
  missingData,
}: LayoutProps): ReactElement => {
  return (
    <div className="container">
      {demoMode === "true" ? (
        <Alert type="warning" headingLevel="h6" slim={true} role="status">
          <Trans i18nKey={"Demo.alertText"} />
        </Alert>
      ) : (
        ""
      )}
      <Header extended>
        <div className="usa-navbar">
          <Title id="extended-logo">
            <em className="usa-logo__text text-primary-darker">
              <Trans i18nKey="Layout.header" />
            </em>
          </Title>
        </div>
      </Header>
      <main className="main">
        <div className="grid-row">
          <div className="desktop:grid-col-8 padding-2 padding-bottom-8">
            {missingData === "true" ? (
              <Alert
                type="error"
                headingLevel="h4"
                className="margin-bottom-3"
                role="alert"
              >
                <Trans i18nKey={"routingError"} />
              </Alert>
            ) : (
              ""
            )}
          </div>
        </div>
        {children}
      </main>
      <Footer
        size="slim"
        primary=""
        secondary={
          <TransLinks
            i18nTextKey="Layout.footer.text"
            i18nLinkKey="Layout.footer.links"
          />
        }
      />
    </div>
  );
};

export default Layout;
