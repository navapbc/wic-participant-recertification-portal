import React from "react";
import { Trans } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { SubmissionForm } from "~/components/SubmissionForm";
import type { SubmissionFormProps } from "~/components/SubmissionForm";
import { cookieParser } from "~/cookies.server";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { findSubmission, fetchSubmissionData } from "~/utils/db.server";

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const submission = await findSubmission(submissionID);
  const submissionData = await fetchSubmissionData(submissionID);
  return json(
    {
      submissionID: submissionID,
      submissionData: submissionData,
      submittedDate: (
        (submission?.updatedAt as Date) || new Date()
      ).toLocaleString("en-US"),
    },
    { headers: headers }
  );
};

export default function Review() {
  const { submissionData, submittedDate } = useLoaderData<typeof loader>();
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
        <strong>
          <Trans i18nKey="Confirm.submitted" />
        </strong>
        {submittedDate}
      </div>
      <SubmissionForm {...formProps} />
    </div>
  );
}
