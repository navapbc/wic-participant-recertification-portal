import React from "react";
import { Trans } from "react-i18next";
import { Link, useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { SubmissionForm } from "~/components/SubmissionForm";
import type { SubmissionFormProps } from "~/components/SubmissionForm";
import { cookieParser } from "~/cookies.server";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { findSubmission, fetchSubmissionData } from "~/utils/db.server";
import { Alert } from "@trussworks/react-uswds";
import { checkRoute, routeRelative } from "~/utils/routing";
import {
  SummaryBox,
  SummaryBoxContent,
  SummaryBoxHeading,
} from "@trussworks/react-uswds";
import TransLinks from "~/components/TransLinks";
import { useHydrated } from "remix-utils";
import { localizeDateString } from "~/utils/date";

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const url = new URL(request.url);
  const previouslySubmitted = url.searchParams.get("previouslySubmitted");
  const submission = await findSubmission(submissionID);
  const submissionData = await fetchSubmissionData(submissionID);
  checkRoute(request, submissionData);
  if (submission?.submitted === false) {
    throw redirect(routeRelative(request, "review"));
  }
  const startOverURL = routeRelative(request, "", { newSession: true });
  return json(
    {
      submissionID: submissionID,
      submissionData: submissionData,
      previouslySubmitted: previouslySubmitted,
      startOverURL: startOverURL,
      submittedDate: submission?.updatedAt,
    },
    { headers: headers }
  );
};

export default function Confirm() {
  const { submissionData, submittedDate, previouslySubmitted, startOverURL } =
    useLoaderData<typeof loader>();

  // Convert to client local timezone, while avoiding hydration errors.
  const isHydrated = useHydrated();
  let convertedSubmittedDate = submittedDate
  if (isHydrated) {
    convertedSubmittedDate = localizeDateString(submittedDate)
  }

  const formProps: SubmissionFormProps = {
    editable: false,
    submissionKey: "Review.details",
    submissionData: submissionData,
  };

  return (
    <div>
      <h1>
        <Trans i18nKey="Confirm.title" />
      </h1>
      <p className="intro">
        <Trans i18nKey="Confirm.intro" />
      </p>
      <div className="margin-top-2">
        {previouslySubmitted === "true" && (
          <Alert
            type="warning"
            headingLevel="h6"
            slim={true}
            role="status"
            className="margin-bottom-2"
          >
            <Trans i18nKey={"Confirm.previouslySubmittedAlert"} />
            <Link to={startOverURL}>
              <Trans i18nKey={"Confirm.startOverText"} />
            </Link>
          </Alert>
        )}
        <strong>
          <Trans i18nKey="Confirm.submitted" />
        </strong>
        {convertedSubmittedDate}
      </div>
      <SummaryBox className="margin-bottom-4">
        <SummaryBoxHeading headingLevel="h2">
          <Trans i18nKey="Confirm.feedback.heading" />
        </SummaryBoxHeading>
        <SummaryBoxContent>
          <p>
            <Trans i18nKey="Confirm.feedback.intro" />
          </p>
          <TransLinks
            i18nTextKey="Confirm.feedback.survey.text"
            i18nLinkKey="Confirm.feedback.survey.link"
          />
        </SummaryBoxContent>
      </SummaryBox>
      <div className="margin-bottom-4 border-bottom-1px" />
      <SubmissionForm {...formProps} />
    </div>
  );
}
