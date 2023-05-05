import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import styles from "~/styles/styles.css";
import { redirect } from "react-router";
import { validRoute } from "app/utils/redirect";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import Layout from "app/components/Layout";
import { camelCase, upperFirst } from "lodash";
import { useEffect } from "react";
import MatomoTracker from "@jonkoops/matomo-tracker";
import { useHydrated } from "remix-utils";
import { MATOMO_SECURE, MATOMO_URL_BASE } from "app/utils/config.server";
import logger from "app/utils/logging.server";

export function useChangeLanguage(locale: string) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const changeLanguage = async () => {
      await i18n.changeLanguage(locale);
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    changeLanguage().catch((error) => {
      logger.error({
        location: "root",
        type: "changeLanguage.error",
        error: error,
      });
    });
  }, [locale, i18n]);
}

export const meta: MetaFunction = ({ location }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- This cannot be a component, it mutates headers
  const { t } = useTranslation();
  const trimBase = location.pathname.replace(/^\/(.*?)\/recertify\/?/, "");
  const route = trimBase != "" ? trimBase : "index";
  const title = t(`${upperFirst(camelCase(route))}.title`);
  return {
    charset: "utf-8",
    title: title,
    viewport: "width=device-width,initial-scale=1",
  };
};

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "icon", href: "favicon.ico" },
  ];
}

type LoaderData = { locale: string; demoMode: string; missingData: string };

export const loader: LoaderFunction = async ({ request, params }) => {
  const redirectTarget = await validRoute(request, params);
  if (redirectTarget) {
    logger.info(
      {
        location: "routes/root",
        type: "redirect.baseURL",
        target: redirectTarget,
      },
      `Redirecting to baseUrl ${redirectTarget}`
    );
    throw redirect(redirectTarget);
  }

  const locale = await i18next.getLocale(request);
  const demoMode = process.env.PUBLIC_DEMO_MODE ?? "false";
  const url = new URL(request.url);

  const missingData =
    url.searchParams.get("missing-data") == "true" ? "true" : "false";
  return json<LoaderData>({ locale, demoMode, missingData });
};

export const handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

export default function App() {
  // Get the locale from the loader
  const { locale, demoMode, missingData } = useLoaderData<LoaderData>();
  const { i18n } = useTranslation();

  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);

  const isHydrated = useHydrated();
  if (isHydrated && MATOMO_URL_BASE) {
    const tracker = new MatomoTracker({
      urlBase: MATOMO_URL_BASE,
      siteId: 1,
      disabled: false, // optional, false by default. Makes all tracking calls no-ops if set to true.
      heartBeat: {
        // optional, enabled by default
        active: true, // optional, default value: true
        seconds: 10, // optional, default value: `15
      },
      linkTracking: false, // optional, default value: true
      configurations: {
        // optional, default value: {}
        // any valid matomo configuration, all below are optional
        disableCookies: true,
        setSecureCookie: MATOMO_SECURE,
        setRequestMethod: "POST",
        trackPageView: true,
      },
    });

    tracker.trackPageView();
  }

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout demoMode={demoMode} missingData={missingData}>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
