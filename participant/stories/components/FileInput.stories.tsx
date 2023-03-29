import { FileInput } from "app/components/FileInput";
import type { FileInputProps } from "app/components/FileInput";

export default {
  component: FileInput,
  title: "Components/Input/FileInput",
};

const defaultProps: FileInputProps = {
  id: "file-input-story",
  name: "file-input-story",
  labelKey: "test:fileinput",
  accept: "image/*,.pdf",
  maxFileCount: 5,
  maxFileSizeInBytes: 5_242_880,
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
