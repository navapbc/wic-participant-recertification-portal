import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { Form, useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { SubmissionForm } from "~/components/SubmissionForm";
import type { SubmissionFormProps } from "~/components/SubmissionForm";
import { cookieParser } from "~/cookies.server";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import {
  findSubmission,
  fetchSubmissionData,
  upsertSubmission,
} from "~/utils/db.server";
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
  if (submission?.submitted) {
    throw redirect(routeRelative(request, "confirm"));
  }
  const submissionData = await fetchSubmissionData(submissionID);
  const [
    editNameURL,
    editDetailsURL,
    editChangesURL,
    editContactURL,
    editUploadUrl,
  ] = ["name", "details", "changes", "contact", "upload"].map((pageref) =>
    routeRelative(request, pageref)
  );
  return json(
    {
      submissionID: submissionID,
      editHrefs: {
        name: editNameURL,
        details: editDetailsURL,
        changes: editChangesURL,
        contact: editContactURL,
        upload: editUploadUrl,
      },
      submissionData: submissionData,
    },
    { headers: headers }
  );
};

export const action = async ({ request }: { request: Request }) => {
  const { submissionID } = await cookieParser(request);
  const submission = await findSubmission(submissionID);
  await upsertSubmission(submissionID, submission!.localAgency.urlId, true);
  const routeTarget = routeRelative(request, "confirm");
  console.log(`Completed review form; routing to ${routeTarget}`);
  return redirect(routeTarget);
};

export default function Review() {
  const { submissionData, editHrefs } = useLoaderData<typeof loader>();
  const formProps: SubmissionFormProps = {
    editable: true,
    editHrefs: editHrefs,
    submissionKey: "Review.details",
    submissionData: submissionData,
  };
  return (
    <div>
      <h1>
        <Trans i18nKey="Review.title" />
      </h1>
      <p className="intro">
        <Trans i18nKey="Review.intro" />
      </p>
      <SubmissionForm {...formProps} />
      <Form method="post">
        <Button type="submit" className="margin-top-6">
          <Trans i18nKey="Review.button" />
        </Button>
      </Form>
    </div>
  );
}
