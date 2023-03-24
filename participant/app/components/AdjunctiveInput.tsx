import type { i18nKey } from "~/types";
import type { ReactElement } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ChoiceGroupInput } from "~/components/ChoiceGroupInput";
import { List } from "app/components/List";
import type {
  Choice,
  ChoiceGroupInputProps,
} from "~/components/ChoiceGroupInput";

export type AdjunctiveInputProps = Omit<
  ChoiceGroupInputProps,
  "choices" | "type" | "legendKey"
> & {
  adjunctiveKey: i18nKey;
};

export const AdjunctiveInput = (props: AdjunctiveInputProps): ReactElement => {
  const { t } = useTranslation();

  const { name, adjunctiveKey, legendStyle, ...rest } = props;
  const adjunctiveChoices: Choice[] = [
    {
      value: "yes",
      labelElement: <Trans i18nKey={`${adjunctiveKey}.yes`} />,
    },
    {
      value: "no",
      labelElement: <Trans i18nKey={`${adjunctiveKey}.no`} />,
    },
  ];
  // eslint-disable-next-line  @typescript-eslint/no-unnecessary-type-assertion
  const programList = t(`${adjunctiveKey}.programs`, {
    returnObjects: true,
  }) as Array<string>;
  const helpElement = (
    <List listKeys={programList} ordered={false} />
  );
  return (
    <ChoiceGroupInput
      choices={adjunctiveChoices}
      name={name}
      type="radio"
      legendKey={`${adjunctiveKey}.label`}
      legendStyle={legendStyle}
      helpElement={helpElement}
      {...rest}
    />
  );
};
