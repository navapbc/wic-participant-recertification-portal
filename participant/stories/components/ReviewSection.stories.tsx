import { ReviewSection } from "app/components/ReviewSection";
import type { ReviewSectionProps } from "app/components/ReviewSection";
import { List } from "app/components/List";
export default {
  component: ReviewSection,
  title: "Components/ReviewSection",
};

const defaultProps: ReviewSectionProps = {
  editButtonKey: "test:reviewsection.edit",
  headingKey: "test:reviewsection.heading",
  children: (
    <List type="unordered" unstyled={true} i18nKey="test:reviewsection.list" />
  ),
};

const ReviewSectionTemplate = {
  render: (props: ReviewSectionProps) => {
    return <ReviewSection {...props} />;
  },
};

export const Default = {
  ...ReviewSectionTemplate,
  args: {
    ...defaultProps,
  },
};

export const Editable = {
  ...ReviewSectionTemplate,
  args: {
    ...defaultProps,
    editHref: "#edit",
  },
};
