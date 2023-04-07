import { FilePreview } from "~/components/FilePreview";
import type { FilePreviewProps } from "~/components/FilePreview";

export default {
  component: FilePreview,
  title: "Components/FilePreview",
};

const defaultProps: FilePreviewProps = {
  imageId: "file-preview-tory",
  name: "fns-stock-produce-shopper.jpg",
  file: "https://user-images.githubusercontent.com/723391/230510476-4f1ab44c-9621-4ab8-8c8b-c1fc1c26dd5e.jpg",
  clickHandler: () => {},
  removeFileKey: "test:filepreview.removeFile",
  altTextKey: "test:filepreview.altText",
  selectedKey: "test:filepreview.selected",
};

const FilePreviewPropsTemplate = {
  render: (props: FilePreviewProps) => {
    return <FilePreview {...props} />;
  },
};

export const Default = {
  ...FilePreviewPropsTemplate,
  args: {
    ...defaultProps,
  },
};
