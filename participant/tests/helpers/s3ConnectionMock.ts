import type { S3Client } from "@aws-sdk/client-s3";
import type { DeepMockProxy } from "jest-mock-extended";
import { mockDeep, mockReset } from "jest-mock-extended";
import { s3Connection } from "app/utils/s3.connection";

jest.mock("app/utils/s3.connection", () => ({
  __esModule: true,
  createS3Client: () => mockDeep<S3Client>(),
}));

beforeEach(() => {
  mockReset(s3Mock);
});

export const s3Mock = s3Connection as unknown as DeepMockProxy<S3Client>;
