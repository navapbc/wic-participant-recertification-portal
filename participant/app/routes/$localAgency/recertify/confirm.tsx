import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { SubmissionForm } from "~/components/SubmissionForm";
import type { SubmissionFormProps } from "~/components/SubmissionForm";
import { cookieParser } from "~/cookies.server";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { findSubmission, fetchSubmissionData } from "~/utils/db.server";
import { routeRelative } from "~/utils/routing";

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
    detailsKey: "Review.details",
    submissionData: submissionData,
  };
  const { t } = useTranslation();

  return (
    <div>
      <h1>
        <Trans i18nKey="Confirm.title" />
      </h1>
      <Trans i18nKey="Confirm.intro" />
      <div className="margin-top-2">
        <Trans i18nKey="Confirm.submitted" />
        {submittedDate}
      </div>
      <SubmissionForm {...formProps} />
    </div>
  );
}
