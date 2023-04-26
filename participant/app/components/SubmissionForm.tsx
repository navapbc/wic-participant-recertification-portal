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
  submissionKey: i18nKey;
};

export const SubmissionForm = ({
  editable,
  editHrefs,
  submissionData,
  submissionKey,
}: SubmissionFormProps): ReactElement => {
  const { t } = useTranslation();
  const editButtonKey = `${submissionKey}.editButton`;
  const nameSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.name : undefined}
      headingKey={`${submissionKey}.name.heading`}
      editButtonKey={editButtonKey}
      key="nameSection"
    >
      <dl>
        <div className="margin-bottom-3">
          <dt>
            <strong>
              <Trans i18nKey={`${submissionKey}.name.firstName`} />
            </strong>
          </dt>
          <dd>{submissionData.name?.firstName}</dd>
        </div>
        <div className="margin-bottom-3">
          <dt>
            <strong>
              <Trans i18nKey={`${submissionKey}.name.lastName`} />
            </strong>
          </dt>
          <dd>{submissionData.name?.lastName}</dd>
        </div>
        {submissionData.name?.preferredName && (
          <div className="margin-bottom-3">
            <dt>
              <strong>
                <Trans i18nKey={`${submissionKey}.name.preferredName`} />
              </strong>
            </dt>
            <dd>{submissionData.name?.preferredName}</dd>
          </div>
        )}
      </dl>
    </ReviewSection>
  );

  const countIntro = t(`${submissionKey}.household.countIntro`, {
    count: submissionData.participant?.length,
    person:
      (submissionData.participant?.length || 1) > 1
        ? t(`${submissionKey}.household.people`)
        : t(`${submissionKey}.household.person`),
  });
  const detailsSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.details : undefined}
      headingKey={`${submissionKey}.household.countHeading`}
      editButtonKey={editButtonKey}
    >
      <div>
        {countIntro}
        <h3>
          <Trans i18nKey={`${submissionKey}.household.detailsHeading`} />
        </h3>
        {submissionData.participant?.map((participant, index) => {
          return (
            <div key={`participant-${index}`}>
              <strong>
                {t(`${submissionKey}.household.participant`, {
                  participantNumber: index + 1,
                })}
              </strong>
              <ul className="margin-top-1">
                <li key={`participant-firstname-${index}`}>
                  {participant.firstName} {participant.lastName}{" "}
                  {participant?.preferredName &&
                    `(${participant.preferredName})`}
                </li>
                <li key={`participant-relationship-${index}`}>
                  {t(`${submissionKey}.household.relationship`, {
                    relationship: t(`Relationship.${participant.relationship}`),
                  })}
                </li>
                <li key={`participant-dob-${index}`}>
                  {t(`${submissionKey}.household.dob`, { ...participant.dob })}
                </li>
                <li key={`participant-adjunctive-${index}`}>
                  {participant.adjunctive !== "yes" ? (
                    <Trans
                      i18nKey={`${submissionKey}.household.noAdjunctive`}
                    />
                  ) : (
                    <Trans i18nKey={`${submissionKey}.household.adjunctive`} />
                  )}
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
      headingKey={`${submissionKey}.changes.heading`}
      editButtonKey={editButtonKey}
    >
      <div>
        <div className="margin-bottom-3">
          <dl>
            <dt>
              <strong>
                <Trans i18nKey={`${submissionKey}.changes.idChangeHeading`} />
              </strong>
              <List
                type="unordered"
                i18nKey="Changes.nameIdQuestion.situations"
                className="margin-top-1"
              />
            </dt>
            <dd>
              <Trans
                i18nKey={`Changes.${submissionData.changes?.idChange}Answer`}
              />
            </dd>
          </dl>
        </div>
        <div className="margin-bottom-3">
          <dl>
            <dt>
              <strong>
                <Trans
                  i18nKey={`${submissionKey}.changes.addressChangeHeading`}
                />
              </strong>
            </dt>
            <dd>
              <Trans
                i18nKey={`Changes.${submissionData.changes?.addressChange}Answer`}
              />{" "}
            </dd>
          </dl>
        </div>
      </div>
    </ReviewSection>
  );
  const documentsSection = (
    <ReviewSection
      editHref={editable && editHrefs ? editHrefs.upload : undefined}
      headingKey={`${submissionKey}.documents.heading`}
      editButtonKey={editButtonKey}
    >
      <dl>
        <dt>
          <strong>
            {t(`${submissionKey}.documents.documentCount`, {
              count: submissionData.documents?.length,
            })}
          </strong>
        </dt>
        <dd>
          <ul className="margin-top-1">
            {submissionData.documents?.map((document, index) => {
              return (
                <li key={`document-${index}`}>{document.originalFilename}</li>
              );
            })}
          </ul>
        </dd>
      </dl>
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
      headingKey={`${submissionKey}.contact.heading`}
      editButtonKey={editButtonKey}
    >
      <dl>
        <div className="margin-bottom-3">
          <dt>
            <strong>
              <Trans i18nKey={`${submissionKey}.contact.phone`} />
            </strong>
          </dt>
          <dd>{formattedPhone}</dd>
        </div>
        {submissionData.contact?.additionalInfo && (
          <div>
            <dt>
              <strong>
                <Trans i18nKey={`${submissionKey}.contact.comments`} />
              </strong>
            </dt>
            <dd>{submissionData.contact.additionalInfo}</dd>
          </div>
        )}
      </dl>
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
