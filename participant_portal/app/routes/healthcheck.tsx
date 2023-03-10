// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import type { LoaderArgs } from "@remix-run/server-runtime";
import db from "~/utils/db.connection";
import invariant from "tiny-invariant";

export async function loader({ request }: LoaderArgs) {
  const host =
    request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

  try {
    invariant(host, "Unable to find host to HEAD");
    const url = new URL("/", `http://${host}`);
    // If we can connect to the database and make a simple query
    // and make a HEAD request to ourselves, then we're good.

    // If you want to display the count of some key table data
    // here, I encourage you to do so.
    // This is coded as a `SELECT 1` merely for speed
    // and to prevent schema edits from breaking the healthcheck
    await Promise.all([
      db.$queryRaw`SELECT 1 as CONNECTED`,
      fetch(url.toString(), { method: "HEAD" }).then((r) => {
        if (!r.ok) return Promise.reject(r);
      }),
    ]);
    return new Response("OK");
  } catch (error: unknown) {
    console.log("healthcheck ❌", { error });
    return new Response("ERROR", { status: 500 });
  }
}
