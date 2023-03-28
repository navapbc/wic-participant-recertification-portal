import { FileInput } from "app/components/FileInput";
import type { FileInputProps } from "app/components/FileInput";

export default {
  component: FileInput,
  title: "Components/Input/FileInput",
};

const defaultProps: FileInputProps = {
  id: "file-input-story",
  labelKey: "test:fileinput.label",
  accept: "image/*",
};

const FileInputPropsTemplate = {
  render: (props: FileInputProps) => {
    return <FileInput {...props} />;
  },
};

export const Default = {
  ...FileInputPropsTemplate,
  args: {
    ...defaultProps,
  },
};
