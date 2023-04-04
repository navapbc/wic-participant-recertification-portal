import { Button } from "@trussworks/react-uswds";
import React from "react";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { cookieParser } from "app/cookies.server";
import { Trans } from "react-i18next";

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  return json(
    {
      submissionID: submissionID,
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export default function Index() {
  const { submissionID } = useLoaderData<loaderData>();

  return (
    <div>
      <h1>
        <Trans i18nKey="Intro.title" />
      </h1>
      <div className="intro">
        <Trans i18nKey="Intro.intro" />
      </div>
      <div>
        <Trans i18nKey="Intro.body" />
      </div>
      <Button className="display-block margin-top-6" type="button">
        <Trans i18nKey="Intro.button" />
      </Button>
    </div>
  );
}
