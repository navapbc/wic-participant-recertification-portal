import { ParticipantCard } from "app/components/ParticipantCard";
import type { ParticipantCardProps } from "app/components/ParticipantCard";

export default {
  component: ParticipantCard,
  title: "Components/ParticipantCard",
};

const defaultProps: ParticipantCardProps = {
  index: 1,
  adjunctiveKey: "test:adjunctive",
  dateKey: "test:dateinput",
  dateHint: true,
  dateLegendKey: "test:dateinput.legend",
  nameKey: "test:nameinput",
  nameLegal: true,
  namePreferred: false,
  participantKey: "test:participantcard",
  relationshipKey: "test:relationship",
};

const ParticipantCardTemplate = {
  render: (props: ParticipantCardProps) => {
    return <ParticipantCard {...props} />;
  },
};

export const Default = {
  ...ParticipantCardTemplate,
  args: {
    ...defaultProps,
  },
};
