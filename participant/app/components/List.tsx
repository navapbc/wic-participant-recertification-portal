import type { ReactElement } from "react";
import type { i18nKey } from "app/types";
import { useTranslation } from "react-i18next";

export type ListProps = {
  i18nKey: i18nKey;
  type: "ordered" | "unordered";
  unstyled?: boolean;
  className?: string;
};

export const List = (props: ListProps): ReactElement => {
  const { t } = useTranslation();

  const {
    i18nKey,
    type = "unordered",
    unstyled = false,
    className = "",
  } = props;
  const listItems: string[] = t(i18nKey, {
    returnObjects: true,
  });
  const classNames = `usa-list ${
    unstyled ? "usa-list--unstyled" : ""
  } ${className}`;
  const ListTag = type == "ordered" ? "ol" : "ul";

  return (
    <ListTag className={classNames.trim()}>
      {listItems.map((item: string) => (
        <li key={item}>{item}</li>
      ))}
    </ListTag>
  );
};

export default List;
