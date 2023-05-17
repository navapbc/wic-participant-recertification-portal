import { FileInput } from "app/components/internal/FileInput";
import type { FileInputProps } from "app/components/internal/FileInput";
import { renderWithRouter } from "tests/helpers/setup";

const defaultProps: FileInputProps = {
  emptyKey: "test:fileuploader.noFiles",
  notEmptyKey: "test:fileuploader.additionalFiles",
  emptyAriaKey: "test:fileuploader.noFilesAria",
  notEmptyAriaKey: "test:fileuploader.additionalFilesAria",
  fileTypeErrorKey: "test:fileuploader.fileTypeError",
  name: "fileinput-test",
  id: "fileinput-test",
};

it("renders a file input correctly", () => {
  const { container } = renderWithRouter(<FileInput {...defaultProps} />);
  expect(container).toMatchSnapshot();
});

it("renders a file input with the 'not empty' text correctly", () => {
  const { container } = renderWithRouter(
    <FileInput {...defaultProps} empty={false} />
  );
  expect(container).toMatchSnapshot();
});
