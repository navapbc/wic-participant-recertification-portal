import React from "react";
import { Trans } from "react-i18next";
import { ButtonLink } from "app/components/ButtonLink";
import { List } from "app/components/List";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { cookieParser } from "app/cookies.server";

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

export default function Index() {
  return (
    <div>
      <h1>
        <Trans i18nKey="Index.title" />
      </h1>
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
