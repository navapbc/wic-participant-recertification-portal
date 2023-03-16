import { AdjunctiveInput } from "~/components/AdjunctiveInput";
import type { AdjunctiveInputProps } from "~/components/AdjunctiveInput";

export default {
  component: AdjunctiveInput,
  title: "Components/Input/AdjunctiveInput",
};

const AdjunctiveTemplate = {
  render: (props: AdjunctiveInputProps) => {
    return <AdjunctiveInput {...props} />;
  },
};

const defaultAdjunctiveProps: Omit<AdjunctiveInputProps, "name"> = {
  adjunctiveKey: "test:adjunctive",
  required: false,
  legendStyle: "default",
};

export const Default = {
  ...AdjunctiveTemplate,
  args: {
    name: "adjunctive-default",
    ...defaultAdjunctiveProps,
  },
};

export const AdjunctiveLargeLegend = {
  ...AdjunctiveTemplate,
  args: {
    name: "relationship-large-legend",
    ...defaultAdjunctiveProps,
    legendStyle: "large",
  },
};

export const AdjunctiveRequired = {
  ...AdjunctiveTemplate,
  args: {
    name: "relationship-large-legend",
    ...defaultAdjunctiveProps,
    required: true,
  },
};
