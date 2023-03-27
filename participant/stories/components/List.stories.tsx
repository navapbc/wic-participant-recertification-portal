import { List } from "app/components/List";
import type { ListProps } from "app/components/List";

export default {
  component: List,
  title: "Components/List",
};

const defaultProps: ListProps = {
  listKeys: ["list-a", "list-b", "list-c"],
  ordered: false,
  unstyled: false,
};

const ListTemplate = {
  render: (props: ListProps) => {
    return <List {...props} />;
  },
};

export const Default = {
  ...ListTemplate,
  args: {
    ...defaultProps,
  },
};

export const OrderedList = {
  ...ListTemplate,
  args: {
    ...defaultProps,
    ordered: true,
  },
};

export const UnstyledList = {
  ...ListTemplate,
  args: {
    ...defaultProps,
    unstyled: true,
  },
};
