/**
 * @jest-environment node
 */
/* eslint-disable jest/no-conditional-expect */
import "aws-sdk-client-mock-jest";
import { s3Mock } from "tests/helpers/s3ConnectionMock";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { BUCKET, MAX_UPLOAD_SIZE_BYTES } from "app/utils/config.server";
import { createReadStream } from "fs";
import { PassThrough } from "stream";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  InvalidObjectState,
} from "@aws-sdk/client-s3";
import {
  checkFile,
  deleteFileFromS3,
  getFileFromS3,
  getURLFromS3,
  headFilesizeFromS3,
  readFileHeadFromS3,
  uploadStreamToS3,
} from "~/utils/s3.server";
jest.mock("@aws-sdk/s3-request-presigner");
const mockedgetSignedURL = jest.mocked(getSignedUrl);

it("should get a file from s3", async () => {
  const mockStream = sdkStreamMixin(
    createReadStream("tests/fixtures/fns-stock-produce-shopper.jpg")
    // stream
  );
  s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });
  const file = await getFileFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
  expect(file).toBeDefined();
  expect(file!.name).toBe("testfile.jpg");
  expect(file!.size).toBe(42740);
});

it("should return undefined if file not found to get in s3", async () => {
  s3Mock
    .on(GetObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));
  const file = await getFileFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
  expect(file).toBeUndefined();
});

it("should throw an error if an unexpected error is encountered while getting a file", async () => {
  s3Mock
    .on(GetObjectCommand)
    .rejects(new InvalidObjectState({ $metadata: {}, message: "Bogus Error" }));
  await expect(getFileFromS3("testfile.jpg")).rejects.toHaveProperty(
    "message",
    "Unable to get testfile.jpg from S3: InvalidObjectState: Bogus Error"
  );
});

it("should read the first 2048 bytes of a file from s3", async () => {
  const mockStream = sdkStreamMixin(
    createReadStream("tests/fixtures/fns-stock-produce-shopper.jpg", {
      start: 0,
      end: 2047,
    })
  );
  s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });
  const byteArray = await readFileHeadFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
    Range: "bytes=0-2047",
  });
  expect(byteArray).toBeDefined();
  expect(byteArray!.length).toBe(2048);
});

it("should return undefined when trying to read the head of an unfound file from s3", async () => {
  s3Mock
    .on(GetObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));

  const byteArray = await readFileHeadFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
    Range: "bytes=0-2047",
  });
  expect(byteArray).toBeUndefined();
});

it("should return an error when trying to read the head from s3, and an error occurs", async () => {
  s3Mock
    .on(GetObjectCommand)
    .rejects(new InvalidObjectState({ $metadata: {}, message: "Bogus Error" }));
  await expect(readFileHeadFromS3("testfile.jpg")).rejects.toHaveProperty(
    "message",
    "Unable to read Head of testfile.jpg from S3: InvalidObjectState: Bogus Error"
  );
});

it("should return the filesize from s3", async () => {
  s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 999 });
  const size = await headFilesizeFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(HeadObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
  expect(size).toBe(999);
});

it("should return undefined when trying to read the size of an unfound file from s3", async () => {
  s3Mock
    .on(HeadObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));
  const size = await headFilesizeFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(HeadObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
  expect(size).toBeUndefined();
});

it("should return an error when trying to get size from s3, and an error occurs", async () => {
  s3Mock
    .on(HeadObjectCommand)
    .rejects(new InvalidObjectState({ $metadata: {}, message: "Bogus Error" }));
  await expect(headFilesizeFromS3("testfile.jpg")).rejects.toHaveProperty(
    "message",
    "Unable to complete head request for testfile.jpg: InvalidObjectState: Bogus Error"
  );
});

it("should get a presigned URL from s3", async () => {
  mockedgetSignedURL.mockImplementation(async () => {
    return "http://s3.fakeland.com/testfile.jpg";
  });
  const s3Url = await getURLFromS3("testfile.jpg");
  expect(s3Url).toBe("http://s3.fakeland.com/testfile.jpg");
});

it("should return undefined for an URL if s3 throws NotFound", async () => {
  mockedgetSignedURL.mockImplementation(async () => {
    throw new NotFound({ $metadata: {}, message: "NotFound" });
  });
  const s3Url = await getURLFromS3("testfile.jpg");
  expect(s3Url).toBe(undefined);
});

it("should throw an error for an URL if s3 throws an unexpected error", async () => {
  mockedgetSignedURL.mockImplementation(async () => {
    throw new InvalidObjectState({ $metadata: {}, message: "Bogus Error" });
  });
  await expect(getURLFromS3("testfile.jpg")).rejects.toHaveProperty(
    "message",
    "Unable to get URL for testfile.jpg: InvalidObjectState: Bogus Error"
  );
});

// @TODO Add a unit test for checking that the presigned urls expire as expected

it("should delete a file from s3", async () => {
  s3Mock.on(DeleteObjectCommand).resolves({});
  await deleteFileFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
});

it("should not throw an error deleting a notFound file from s3", async () => {
  s3Mock
    .on(DeleteObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));
  await deleteFileFromS3("testfile.jpg");
  expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
    Key: "testfile.jpg",
    Bucket: BUCKET,
  });
});

it("should throw an error deleting a file from s3 with another error", async () => {
  s3Mock
    .on(DeleteObjectCommand)
    .rejects(new InvalidObjectState({ $metadata: {}, message: "Bogus Error" }));
  await expect(deleteFileFromS3("testfile.jpg")).rejects.toHaveProperty(
    "message",
    "Unable to delete testfile.jpg: InvalidObjectState: Bogus Error"
  );
});

it("should be invalid if the filesize is too large", async () => {
  s3Mock
    .on(HeadObjectCommand)
    .resolves({ ContentLength: MAX_UPLOAD_SIZE_BYTES + 1 });
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({ error: "invalidSize", size: 26214401 });
});

it("should be invalid if the filesize is undefined", async () => {
  s3Mock
    .on(HeadObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({ error: "notFound" });
});

it("should be invalid if the file is unreadable", async () => {
  s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 42740 });
  s3Mock
    .on(GetObjectCommand)
    .rejects(new NotFound({ $metadata: {}, message: "NotFound" }));
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({ error: "cannotRead", size: 42740 });
});

it("should be invalid if the file cannot be typed", async () => {
  // This was just the fastest way to make an empty stream that did
  // not make Typescript cry
  const xs = new PassThrough({
    objectMode: true,
  });
  xs.end();
  const mockStream = sdkStreamMixin(xs);
  s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 42740 });
  s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({ error: "cannotType", size: 42740 });
});

it("should be invalid if the file type is incorrect", async () => {
  const mockStream = sdkStreamMixin(
    createReadStream("tests/utils/s3.server.test.ts", {
      start: 0,
      end: 2047,
    })
  );
  s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });
  s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 42740 });
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({
    error: "invalidType",
    size: 42740,
    mimeType: "application/javascript",
  });
});

it("should be valid if the filesize, and type are correct", async () => {
  const mockStream = sdkStreamMixin(
    createReadStream("tests/fixtures/fns-stock-produce-shopper.jpg", {
      start: 0,
      end: 2047,
    })
  );
  s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });
  s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 42740 });
  const validFile = await checkFile("testfile.jpg");
  expect(validFile).toEqual({ mimeType: "image/jpeg", size: 42740 });
});

it("should retry upload parts if one errors", async () => {
  const mockStream = sdkStreamMixin(
    createReadStream("tests/fixtures/fns-stock-produce-shopper.jpg")
  );
  await expect(
    uploadStreamToS3(mockStream, "fns-stock-produce-shopper.jpg")
  ).rejects.toHaveProperty(
    "message",
    "Upload of fns-stock-produce-shopper.jpg to S3 aborted!"
  );
});
