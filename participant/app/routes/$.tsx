import { redirect } from "@remix-run/server-runtime";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { validRoute } from "~/utils/redirect";
import logger from "app/utils/logging.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  if (url.pathname.includes("favicon.ico")) {
    throw redirect("/favicon.ico");
  }
  const redirectTarget = await validRoute(request, params, true);
  if (redirectTarget) {
    logger.info(
      { location: "routes/$", type: "redirect.target", target: redirectTarget },
      `Redirecting to ${redirectTarget}`
    );
    throw redirect(redirectTarget);
  }
  return null;
};
