import { redirect } from "@remix-run/server-runtime";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { validRoute } from "~/utils/redirect";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  if (url.pathname.includes("favicon.ico")) {
    throw redirect("/favicon.ico");
  }
  const redirectTarget = await validRoute(request, params, true);
  if (redirectTarget) {
    console.log(`Redirecting to recertify ${redirectTarget}`);
    throw redirect(redirectTarget);
  }
  return null;
};
