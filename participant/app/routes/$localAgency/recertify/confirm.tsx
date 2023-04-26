import React from "react";
import { Trans } from "react-i18next";
import { Link, useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { SubmissionForm } from "~/components/SubmissionForm";
import type { SubmissionFormProps } from "~/components/SubmissionForm";
import { cookieParser } from "~/cookies.server";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { findSubmission, fetchSubmissionData } from "~/utils/db.server";
import { Alert } from "@trussworks/react-uswds";
import { routeRelative } from "~/utils/routing";

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
  const startOverURL = routeRelative(request, "", { newSession: true });
  return json(
    {
      submissionID: submissionID,
      submissionData: submissionData,
      previouslySubmitted: previouslySubmitted,
      startOverURL: startOverURL,
      submittedDate: (
        (submission?.updatedAt as Date) || new Date()
      ).toLocaleString("en-US"),
    },
    { headers: headers }
  );
};

export default function Confirm() {
  const { submissionData, submittedDate, previouslySubmitted, startOverURL } =
    useLoaderData<typeof loader>();
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
        {submittedDate}
      </div>
      <SubmissionForm {...formProps} />
    </div>
  );
}
