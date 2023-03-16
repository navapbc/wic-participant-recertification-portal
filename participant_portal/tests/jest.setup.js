import { installGlobals } from "@remix-run/node"; // or cloudflare/deno
import { setGlobalConfig } from "@storybook/testing-react"; // path of your preview.js file
import * as globalStorybookConfig from ".storybook/preview";

// Does this actually set up axe?
// Set up Axe
require("@testing-library/jest-dom");
// This installs globals such as "fetch", "Response", "Request" and "Headers".

installGlobals();
// setupFile.js - this will run before the tests in jest.

setGlobalConfig(globalStorybookConfig);
