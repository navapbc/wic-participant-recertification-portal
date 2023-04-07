import { FilePreview } from "~/components/FilePreview";
import type { FilePreviewProps } from "~/components/FilePreview";
import { getTestImage } from "tests/helpers/mockData";
import { renderWithRouter } from "tests/helpers/setup";
const defaultProps: Omit<FilePreviewProps, "file"> = {
  imageId: "test-image",
  altTextKey: "test:fileuploader.altText",
  selectedKey: "test:fileuploader.selected",
  removeFileKey: "test:fileuploader.removeFile",
  name: "test-file.jpg",
  clickHandler: () => {},
};

const fileFixtureURL = "file://fixtures/fns-stock-produce-shopper.jpg";

URL.createObjectURL = jest.fn().mockReturnValue(fileFixtureURL);

it("renders a file preview correctly", () => {
  const { container } = renderWithRouter(
    <FilePreview {...defaultProps} file={getTestImage("test-file.jpg")} />
  );
  expect(container).toMatchSnapshot();
});

it("renders a file preview from a file URL correctly", () => {
  const { container } = renderWithRouter(
    <FilePreview {...defaultProps} file={fileFixtureURL} />
  );
  expect(container).toMatchSnapshot();
});
