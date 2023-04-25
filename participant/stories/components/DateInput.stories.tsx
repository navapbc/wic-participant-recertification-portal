import { DateInput } from "app/components/DateInput";
import type { DateInputProps } from "app/components/DateInput";

export default {
  component: DateInput,
  title: "Components/Input/DateInput",
};

const defaultProps: DateInputProps = {
  id: "date-example",
  name: "date-example",
  dateKey: "test:dateinput",
  legendKey: "test:dateinput.legend",
  keyBase: "date-example",
};

const DateInputTemplate = {
  render: (props: DateInputProps) => {
    return <DateInput {...props} />;
  },
};

export const Default = {
  ...DateInputTemplate,
  args: {
    ...defaultProps,
  },
};

export const Hint = {
  ...DateInputTemplate,
  args: {
    ...defaultProps,
    hint: true,
  },
};

export const DayMonthYearHint = {
  ...DateInputTemplate,
  args: {
    ...defaultProps,
    hint: true,
    DMYorder: true,
  },
};
