import { ChoiceGroupInput } from "~/components/ChoiceGroupInput";
import type { ChoiceGroupInputProps } from "~/components/ChoiceGroupInput";
import { Trans } from "react-i18next";
import { Form } from "@remix-run/react";

export default {
  component: ChoiceGroupInput,
  title: "Components/Input/ChoiceGroupInput",
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

const ChoiceGroupInputTemplate = {
  render: (props: ChoiceGroupInputProps) => {
    return (
      <Form>
        <ChoiceGroupInput {...props} />
      </Form>
    );
  },
};

const defaultChoiceGroupInputProps = {
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
  legendStyle: "",
  type: "radio",
};

export const RadioGroup = {
  ...ChoiceGroupInputTemplate,
  args: {
    name: "input-radio",
    ...defaultChoiceGroupInputProps,
  },
};

export const RadioGroupLargeLegend = {
  ...ChoiceGroupInputTemplate,
  args: {
    name: "input-radio",
    ...defaultChoiceGroupInputProps,
    legendStyle: "large",
  },
};

const helpElement = (
  <Trans i18nKey={"test:inputchoice.helpHeader"} id="help-text" />
);

export const RadioGroupWithHelpLargeLegend = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    helpElement: helpElement,
    name: "input-radio-help",
    legendStyle: "large",
  },
};

export const RadioGroupWithHelp = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    helpElement: helpElement,
    name: "input-radio-help",
  },
};

export const CheckboxGroup = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
    name: "input-checkbox",
  },
};

export const CheckboxGroupLargeLegend = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
    name: "input-checkbox",
    legendStyle: "large",
  },
};

export const CheckboxGroupWithHelp = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    helpElement: helpElement,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
    name: "input-checkbox-help",
  },
};

export const CheckboxGroupWithHelpLargeLegend = {
  ...ChoiceGroupInputTemplate,
  args: {
    ...defaultChoiceGroupInputProps,
    helpElement: helpElement,
    titleKey: "test:inputchoice.labelCheckbox",
    type: "checkbox",
    name: "input-checkbox-help",
    legendStyle: "large",
  },
};
