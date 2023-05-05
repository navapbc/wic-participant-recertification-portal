// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import type { LoaderArgs } from "@remix-run/server-runtime";
import db from "~/utils/db.connection";
import logger from "app/utils/logging.server";

// Healthcheck returns OK if this resource route is successfully reached
// AND we are able to connect to the database and make a simple query.
export async function loader({ request }: LoaderArgs) {
  try {
    // If you want to display the count of some key table data
    // here, I encourage you to do so.
    // This is coded as a `SELECT 1` merely for speed
    // and to prevent schema edits from breaking the healthcheck
    await Promise.all([db.$queryRaw`SELECT 1 as CONNECTED`]);
    return new Response("OK");
  } catch (error: unknown) {
    logger.error(
      { location: "healthcheck", type: "error", error: error },
      "healthcheck ❌"
    );
    return new Response("ERROR", { status: 500 });
  }
}
