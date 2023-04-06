import { List } from "app/components/List";
import type { ListProps } from "app/components/List";

export default {
  component: List,
  title: "Components/List",
};

const defaultProps: ListProps = {
  i18nKey: "test:list.listItems",
  type: "unordered",
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
    type: "ordered",
  },
};

export const UnstyledList = {
  ...ListTemplate,
  args: {
    ...defaultProps,
    unstyled: true,
  },
};
