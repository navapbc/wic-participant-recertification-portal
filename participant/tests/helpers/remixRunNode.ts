export { writeAsyncIterableToWritable, createCookie } from "@remix-run/node";

export const redirect = (target: string) => {
  return new Error(target);
};
