import { ButtonLink } from "app/components/ButtonLink";
import type { ButtonLinkProps } from "app/components/ButtonLink";

export default {
  component: ButtonLink,
  title: "Components/ButtonLink",
};

const defaultProps: ButtonLinkProps = {
  to: "#",
  children: "Button",
};

const ButtonLinkTemplate = {
  render: (props: ButtonLinkProps) => {
    return <ButtonLink {...props} />;
  },
};

export const Default = {
  ...ButtonLinkTemplate,
  args: {
    ...defaultProps,
  },
};
