import { NameInput, NameInputProps } from "app/components/NameInput";

export default {
  component: NameInput,
  title: "Components/NameInput",
};

const defaultProps: NameInputProps = {
  id: "input-example",
  firstNameKey: "test:nameinput.firstname",
  lastNameKey: "test:nameinput.lastname",
  legalKey: "test:nameinput.legal",
  legendKey: "test:nameinput.legend",
  legendStyle: "srOnly",
  preferredKey: "test:nameinput.preferred",
};

const NameInputTemplate = {
  render: (props: NameInputProps) => {
    return <NameInput {...props} />;
  },
};

export const Default = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
  },
};

export const PreferredName = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    preferred: true,
  },
};

export const VisibleLegend = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    legendStyle: "default",
  },
};

export const PreferredNameVisibleLegend = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    preferred: true,
    legendStyle: "default",
  },
};
