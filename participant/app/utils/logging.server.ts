/* eslint-disable no-var */
// We cannot use a let or const in a global object
import { LOG_LEVEL } from "app/utils/config.server";
import pino from "pino";
import type { Logger } from "pino";
let logger: Logger;

declare global {
  var __logger: Logger;
}

if (!global.__logger) {
  try {
    global.__logger = pino({ level: LOG_LEVEL });
  } catch (e) {
    console.error(`‼️ Unable to create logger: {e}`);
  }
}

logger = global.__logger;
export default logger;
