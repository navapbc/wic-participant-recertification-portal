import { installGlobals } from "@remix-run/node"; // or cloudflare/deno
// Does this actually set up axe?
// Set up Axe
require("@testing-library/jest-dom");
// This installs globals such as "fetch", "Response", "Request" and "Headers".

installGlobals();
