import { InputChoiceGroup } from "app/components/InputChoiceGroup";
import type { InputChoiceGroupProps } from "app/components/InputChoiceGroup";
import { Trans } from "react-i18next";

export default {
  component: InputChoiceGroup,
  title: "Components/InputChoiceGroup",
  argTypes: {
    name: {
      description: "Name for the element",
    },
    titleKey: {
      description: "i18n key for the title of the InputChoiceGroup",
    },
    choices: {
      description: "List of options for the group",
    },
    helpElement: {
      description:
        "Add a ReactElement to provide additional info, like an Accordion",
    },
    type: {
      description: "Selects checkbox or radio for the InputChoiceGroup",
    },
    handleChange: {
      description: "JavaScript function to call onChange",
    },
    required: {
      description: "Displays a required element if true",
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false,
        },
      },
    },
  },
};

const InputChoiceTemplate = {
  render: (props: InputChoiceGroupProps) => {
    return <InputChoiceGroup {...props} />;
  },
};

const defaultInputChoiceGroupProps: InputChoiceGroupProps = {
  name: "example-input-group",
  choices: [
    {
      value: "option1",
      labelElement: <Trans i18nKey={"test:inputchoice.label1"} />,
    },
    {
      value: "option2",
      labelElement: <Trans i18nKey={"test:inputchoice.label2"} />,
    },
    {
      value: "option3",
      labelElement: <Trans i18nKey={"test:inputchoice.label3"} />,
    },
  ],
  required: false,
  legendKey: "test:inputchoice.labelRadio",
  type: "radio",
  handleChange: (e) => {},
};

export const RadioGroup = {
  ...InputChoiceTemplate,
  args: {
    ...defaultInputChoiceGroupProps,
  },
};

export const CheckboxGroup = {
  ...InputChoiceTemplate,
  args: {
    ...defaultInputChoiceGroupProps,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
  },
};

const helpElement = (
  <Trans i18nKey={"test:inputchoice.helpHeader"} id="help-text" />
);

export const RadioGroupWithHelp = {
  ...InputChoiceTemplate,
  args: {
    ...defaultInputChoiceGroupProps,
    helpElement: helpElement,
  },
};

export const CheckboxGroupWithHelp = {
  ...InputChoiceTemplate,
  args: {
    ...defaultInputChoiceGroupProps,
    helpElement: helpElement,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
  },
};
