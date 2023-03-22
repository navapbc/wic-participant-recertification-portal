import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Params, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { cookieParser } from "app/cookies.server";
import { Trans, useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { submissionID } = useLoaderData<loaderData>();

  return (
    <div>
      <h1>{t("Intro.title")}</h1>
      <div className="font-sans-lg">
        <Trans i18nKey="Intro.intro" />
      </div>
      <div>
        <Trans i18nKey="Intro.body" />
      </div>
      <Button className="display-block margin-top-6" type="button">
        {t("Intro.button")}
      </Button>
    </div>
  );
}
