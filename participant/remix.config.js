/**
 * @type {import('@remix-run/dev').AppConfig}
 */
const { getDependenciesToBundle } = require("@remix-run/dev");
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  serverDependenciesToBundle: [
    /strtok3/,
    ...getDependenciesToBundle("file-type", "token-types", "peek-readable"),
  ],
};
