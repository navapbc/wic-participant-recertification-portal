import React from "react";
import { Trans } from "react-i18next";
import { ButtonLink } from "app/components/ButtonLink";
import { List } from "app/components/List";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { cookieParser } from "app/cookies.server";
import { Alert } from "@trussworks/react-uswds";

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const url = new URL(request.url);
  const resetSession = url.searchParams.get("resetSession");
  return json(
    {
      submissionID: submissionID,
      resetSession: resetSession,
    },
    { headers: headers }
  );
};

export default function Index() {
  const { resetSession } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>
        <Trans i18nKey="Index.title" />
      </h1>
      <div className="margin-top-2">
        {resetSession === "true" && (
          <Alert
            type="warning"
            headingLevel="h6"
            slim={true}
            role="status"
            className="margin-bottom-2"
          >
            <Trans i18nKey={"Index.resetSession"} />
          </Alert>
        )}
      </div>
      <p className="intro">
        <Trans i18nKey="Index.intro" />
      </p>

      <p>
        <Trans i18nKey="Index.eligible" />
      </p>
      <List i18nKey={"Index.ifList"} type="ordered" />
      <p>
        <Trans i18nKey="Index.note" />
      </p>
      <p>
        <Trans i18nKey="Index.time" />
      </p>
      <ButtonLink to="about" className="margin-top-6">
        <Trans i18nKey="Index.button" />
      </ButtonLink>
    </div>
  );
}
