import { prismaMock } from "tests/helpers/prismaMock";
import db from "app/utils/db.connection";

// This is a rhetorical test, but illustrates that
// you can mock using prismaMock, and components that
// use DB for queries will return the mocked values.
it("returns a 1 from a raw SELECT 1", async () => {
  prismaMock.$queryRaw.mockResolvedValue([{ connected: 1 }]);
  const result = await db.$queryRaw`SELECT 1 as CONNECTED`;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  expect(prismaMock.$queryRaw).toHaveBeenCalledWith(["SELECT 1 as CONNECTED"]);
  expect(result).toStrictEqual([{ connected: 1 }]);
});
