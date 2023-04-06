import { FileUploader } from "~/components/FileUploader";
import type { FileUploaderProps } from "~/components/FileUploader";

export default {
  component: FileUploader,
  title: "Components/Input/FileUploader",
};

const defaultProps: FileUploaderProps = {
  id: "file-uploader-story",
  name: "file-uploader-story",
  labelKey: "test:fileuploader",
  accept: "image/*,.pdf",
  maxFileCount: 5,
  maxFileSizeInBytes: 5_242_880,
};

const FileUploaderPropsTemplate = {
  render: (props: FileUploaderProps) => {
    return <FileUploader {...props} />;
  },
};

export const Default = {
  ...FileUploaderPropsTemplate,
  args: {
    ...defaultProps,
  },
};
