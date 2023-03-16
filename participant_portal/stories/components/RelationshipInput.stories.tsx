import { RelationshipInput } from "~/components/RelationshipInput";
import type { RelationshipInputProps } from "~/components/RelationshipInput";
import { Form } from "@remix-run/react";

export default {
  component: RelationshipInput,
  title: "Components/Input/RelationshipInput",
};

const RelationshipInputTemplate = {
  render: (props: RelationshipInputProps) => {
    return (
      <Form>
        <RelationshipInput {...props} />
      </Form>
    );
  },
};

const defaultRelationshipInputProps: Omit<RelationshipInputProps, "name"> = {
  relationshipKey: "test:relationship",
  required: false,
  legendKey: "test:relationship.label",
  legendStyle: "default",
};

export const Default = {
  ...RelationshipInputTemplate,
  args: {
    name: "relationship-default",
    ...defaultRelationshipInputProps,
  },
};

export const RelationshipInputLargeLegend = {
  ...RelationshipInputTemplate,
  args: {
    name: "relationship-large-legend",
    ...defaultRelationshipInputProps,
    legendStyle: "large",
  },
};
