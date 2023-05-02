export {
  writeAsyncIterableToWritable,
  createCookie,
} from "../../node_modules/@remix-run/node";

export class Redirect extends Error {
  headers?: Map<string, string>;
  status: number;
  constructor(msg: string, options?: ResponseInit) {
    super(msg);
    this.name = "Redirect";
    this.headers = new Map(Object.entries(options?.headers || []));
    this.status = options?.status || 302;
  }
}

export const redirect = (target: string, options?: ResponseInit) => {
  return new Redirect(target, options);
};
