import type { ReactElement } from "react";
import type { RelationshipType, i18nKey } from "~/types";
import { ChoiceGroupInput } from "~/components/ChoiceGroupInput";
import type {
  ChoiceGroupInputProps,
  Choice,
} from "~/components/ChoiceGroupInput";
import { Trans } from "react-i18next";

export type RelationshipInputProps = Omit<
  ChoiceGroupInputProps,
  "choices" | "type"
> & {
  relationshipKey: i18nKey;
  keyBase: string;
  values?: RelationshipType;
  required?: boolean;
};

export const RelationshipInput = (
  props: RelationshipInputProps
): ReactElement => {
  const { relationshipKey, values, required, ...rest } = props;
  const relationships = ["self", "child", "grandchild", "foster", "other"];
  const choices: Choice[] = relationships.map((relationship) => ({
    value: relationship,
    labelElement: <Trans i18nKey={`${relationshipKey}.${relationship}`} />,
    selected: values && values == relationship,
  }));
  return <ChoiceGroupInput choices={choices} type="radio" required={required} {...rest} />;
};
