import TransLinks from "app/components/TransLinks";
import type { TransLinkProps } from "app/components/TransLinks";

export default {
  component: TransLinks,
  title: "Components/TransLinks",
};

const defaultProps: TransLinkProps = {
  i18nTextKey: "test:translinks.plainStringLinks.text",
  i18nLinkKey: "test:translinks.plainStringLinks.links",
};

export const TransLinksTemplate = {
  render: (props: TransLinkProps) => {
    return <TransLinks {...props} />;
  },
};

export const Default = {
  ...TransLinksTemplate,
  args: {
    ...defaultProps,
  },
};

export const MultipleLinks = {
  ...TransLinksTemplate,
  args: {
    i18nTextKey: "test:translinks.plainStringLinksComplicated.text",
    i18nLinkKey: "test:translinks.plainStringLinksComplicated.links",
  },
};

export const SingleStyledLink = {
  ...TransLinksTemplate,
  args: {
    i18nTextKey: "test:translinks.styledString.text",
    i18nLinkKey: "test:translinks.styledString.links",
  },
};

export const MultipleStyledLinks = {
  ...TransLinksTemplate,
  args: {
    i18nTextKey: "test:translinks.styledLink.text",
    i18nLinkKey: "test:translinks.styledLink.links",
  },
};
