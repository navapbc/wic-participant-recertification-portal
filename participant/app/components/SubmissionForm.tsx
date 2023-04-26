import type { SubmissionData, i18nKey } from "app/types";
import { ReviewSection } from "./ReviewSection";
import { Trans, useTranslation } from "react-i18next";
import type { ReactElement } from "react";
import List from "app/components/List";
export type SubmissionFormProps = {
  editable: boolean;
  editHrefs?: {
    name: string;
    details: string;
    changes: string;
    contact: string;
    upload: string;
  };
  submissionData: SubmissionData;
  detailsKey: i18nKey;
};

export const SubmissionForm = ({
  editable,
  editHrefs,
  submissionData,
  detailsKey,
}: SubmissionFormProps): ReactElement => {
  const { t } = useTranslation();
  const editButtonKey = `${detailsKey}.editButton`;
  const nameSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.name : undefined}
      headingKey={`${detailsKey}.name.heading`}
      editButtonKey={editButtonKey}
      key="nameSection"
    >
      <dl>
        <dt>
          <strong>
            <Trans i18nKey={`${detailsKey}.name.firstName`} />
          </strong>
        </dt>
        <dd>{submissionData.name?.firstName}</dd>

        <dt>
          <strong>
            <Trans i18nKey={`${detailsKey}.name.lastName`} />
          </strong>
        </dt>
        <dd>{submissionData.name?.lastName}</dd>
        {submissionData.name?.preferredName && (
          <>
            <dt>
              <strong>
                <Trans i18nKey={`${detailsKey}.name.preferredName`} />
              </strong>
            </dt>
            <dd>{submissionData.name?.preferredName}</dd>
          </>
        )}
      </dl>
    </ReviewSection>
  );
  const detailsSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.details : undefined}
      headingKey={`${detailsKey}.household.countHeading`}
      editButtonKey={editButtonKey}
    >
      <div>
        <Trans
          i18nKey={`${detailsKey}.household.countIntro`}
          count={submissionData.participant?.length}
        />
        <h3>
          <Trans i18nKey={`${detailsKey}.household.detailsHeading`} />
        </h3>
        {submissionData.participant?.map((participant, index) => {
          return (
            <div key={`participant-${index}`}>
              <strong>
                {t(`${detailsKey}.household.participant`, {
                  participantNumber: index + 1,
                })}
              </strong>
              <ul>
                <li key={`participant-firstname-${index}`}>
                  {participant.firstName} {participant.lastName}{" "}
                  {participant?.preferredName &&
                    `(${participant.preferredName})`}
                </li>
                <li key={`participant-relationship-${index}`}>
                  {t(`${detailsKey}.household.relationship`, {
                    relationship: t(`Relationship.${participant.relationship}`),
                  })}
                </li>
                <li key={`participant-dob-${index}`}>
                  {t(`${detailsKey}.household.dob`, { ...participant.dob })}
                </li>
                <li key={`participant-adjunctive-${index}`}>
                  {participant.adjunctive !== "yes" && (
                    <Trans i18nKey={`${detailsKey}.household.noAdjunctive`} />
                  )}
                  <Trans i18nKey={`${detailsKey}.household.adjunctive`} />
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </ReviewSection>
  );
  const changesSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.changes : undefined}
      headingKey={`${detailsKey}.changes.heading`}
      editButtonKey={editButtonKey}
    >
      <div>
        <div>
          <strong>
            <Trans i18nKey={`${detailsKey}.changes.idChangeHeading`} />
          </strong>
          <List type="unordered" i18nKey="Changes.nameIdQuestion.situations" />
          <div className="margin-top-2">
            <Trans
              i18nKey={`Changes.${submissionData.changes?.idChange}Answer`}
            />
          </div>
        </div>
        <div className="margin-top-2">
          <strong>
            <Trans i18nKey={`${detailsKey}.changes.addressChangeHeading`} />
          </strong>
          <div className="margin-top-2 margin-bottom-2">
            <Trans
              i18nKey={`Changes.${submissionData.changes?.addressChange}Answer`}
            />
          </div>
        </div>
      </div>
    </ReviewSection>
  );
  const documentsSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.upload : undefined}
      headingKey={`${detailsKey}.documents.heading`}
      editButtonKey={editButtonKey}
    >
      <div>
        <strong>
          {t(`${detailsKey}.documents.documentCount`, {
            count: submissionData.documents?.length,
          })}
        </strong>
        <ul>
          {submissionData.documents?.map((document, index) => {
            return (
              <li key={`document-${index}`}>{document.originalFilename}</li>
            );
          })}
        </ul>
      </div>
    </ReviewSection>
  );
  const formattedPhone =
    submissionData.contact?.phoneNumber.slice(0, 3) +
    "-" +
    submissionData.contact?.phoneNumber.slice(3, 6) +
    "-" +
    submissionData.contact?.phoneNumber.slice(6);
  const contactSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.contact : undefined}
      headingKey={`${detailsKey}.contact.heading`}
      editButtonKey={editButtonKey}
    >
      <div>
        <div className="margin-bottom-1">
          <strong>
            <Trans i18nKey={`${detailsKey}.contact.phone`} />
          </strong>
        </div>
        {formattedPhone}
        {submissionData.contact?.additionalInfo && (
          <div className="margin-top-1 margin-bottom-1">
            <div className="margin-bottom-1">
              <strong>
                <Trans i18nKey={`${detailsKey}.contact.comments`} />
              </strong>
            </div>
            <div>{submissionData.contact.additionalInfo}</div>
          </div>
        )}
      </div>
    </ReviewSection>
  );
  return (
    <>
      {nameSection}
      {detailsSection}
      {changesSection}
      {documentsSection}
      {contactSection}
    </>
  );
};
