import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";
// import s3Connection from "app/utils/s3.connection";

jest.mock("app/utils/s3.connection", () => ({
  __esModule: true,
  default: s3Mock,
  ensureBucketExists: () => {
    return true;
  },
}));

beforeEach(() => {
  s3Mock.reset();
});

export const s3Mock = mockClient(S3Client);
