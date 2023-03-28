import { renderWithRouter } from "tests/helpers/setup";

import { List } from "app/components/List";
import type { ListProps } from "app/components/List";

const defaultProps: ListProps = {
  listKeys: ["list-a", "list-b", "list-c"],
  type: "unordered",
  unstyled: false,
};

it("renders list component", () => {
  const { container } = renderWithRouter(<List {...defaultProps} />);
  expect(container).toMatchSnapshot();
});

it("renders as an ordered list", () => {
  const { container } = renderWithRouter(
    <List {...defaultProps} type="ordered" />
  );
  expect(container).toMatchSnapshot();
});

it("renders as an unstyled list", () => {
  const { container } = renderWithRouter(
    <List {...defaultProps} unstyled={true} />
  );
  expect(container).toMatchSnapshot();
});

it("renders additional class names", () => {
  const { container } = renderWithRouter(
    <List {...defaultProps} className="hello there" />
  );
  expect(container).toMatchSnapshot();
});
