import { readFileSync } from "fs";
const goodFile = readFileSync(
  "tests/fixtures/fns-stock-produce-shopper.jpg",
  null
);
const goodFileSlice = Uint8Array.prototype.slice.call(goodFile).slice(0, 2048);

function compare(a: Uint8Array, b: Uint8Array) {
  for (let i = a.length; -1 < i; i -= 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
export const fileTypeFromBuffer = async (buffer: Buffer | Uint8Array) => {
  if (buffer.length == 0) {
    return undefined;
  }
  if (compare(goodFileSlice, buffer)) {
    return { mime: "image/jpeg" };
  }
  return { mime: "application/javascript" };
};
