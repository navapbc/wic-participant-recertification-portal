import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";

jest.mock("app/utils/s3.connection", () => ({
  __esModule: true,
  default: s3Mock,
}));

beforeEach(() => {
  s3Mock.reset();
});

export const s3Mock = mockClient(S3Client);
