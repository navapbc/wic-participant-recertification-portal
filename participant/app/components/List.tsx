import type { ReactElement } from "react";
import type { i18nKey } from "app/types";
import { Trans } from "react-i18next";

export type ListProps = {
  listKeys: i18nKey[];
  ordered?: boolean;
  unstyled?: boolean;
  className?: string;
};

export const List = (props: ListProps): ReactElement => {
  const { listKeys, ordered = false, unstyled = false, className = "" } = props;
  const classNames = `usa-list ${
    unstyled ? "usa-list--unstyled" : ""
  } ${className}`;
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag className={classNames.trim()}>
      {listKeys.map((key: string) => (
        <li key={key}>
          <Trans i18nKey={key} />
        </li>
      ))}
    </ListTag>
  );
};

export default List;
