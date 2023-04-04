import { FileUploader } from "app/components/FileUploader";
import type { FileUploaderProps } from "app/components/FileUploader";
import { renderWithRouter } from "tests/helpers/setup";

const defaultProps: FileUploaderProps = {
  id: "file-uploader-story",
  name: "file-uploader-story",
  labelKey: "test:fileuploader",
  accept: "image/*,.pdf",
  maxFileCount: 5,
  maxFileSizeInBytes: 5_242_880,
};

it("renders a file uploader", () => {
  const { container } = renderWithRouter(<FileUploader {...defaultProps} />);
  expect(container).toMatchSnapshot();
});
