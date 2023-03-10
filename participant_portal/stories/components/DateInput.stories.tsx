import { DateInput, DateInputProps } from "app/components/DateInput";

export default {
  component: DateInput,
  title: "Components/DateInput",
};

const defaultProps: DateInputProps = {
  id: "date-example",
  name: "date-example",
  monthKey: "test:dateinput.month",
  dayKey: "test:dateinput.day",
  yearKey: "test:dateinput.year",
  hintKey: "test:dateinput.hint",
  legendKey: "test:dateinput.legend",
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
    hintKey: "test:dateinput.hintDMY",
    DMYorder: true,
  },
};
