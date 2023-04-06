import { FilePreview } from "~/components/internal/FilePreview";
import type { FilePreviewProps } from "~/components/internal/FilePreview";
import { getTestImage } from "tests/helpers/mockData";
import { renderWithRouter } from "tests/helpers/setup";
const defaultProps: FilePreviewProps = {
  imageId: "test-image",
  altTextKey: "test:fileuploader.altText",
  selectedKey: "test:fileuploader.selected",
  removeFileKey: "test:fileuploader.removeFile",
  file: getTestImage("test-file.jpg"),
  clickHandler: () => {},
};

URL.createObjectURL = jest
  .fn()
  .mockReturnValue("file://fixtures/fns-stock-produce-shopper.jpg");

it("renders a file preview correctly", () => {
  const { container } = renderWithRouter(<FilePreview {...defaultProps} />);
  expect(container).toMatchSnapshot();
});
