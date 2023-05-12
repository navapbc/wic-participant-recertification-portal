/**
 * @jest-environment node
 */
import { prismaMock } from "tests/helpers/prismaMock";
import { main } from "batch/refreshS3Urls";
import { getDocument } from "tests/helpers/mockData";
import "aws-sdk-client-mock-jest";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
jest.mock("@aws-sdk/s3-request-presigner");
const mockedgetSignedURL = jest.mocked(getSignedUrl);

it("tests updates expired documents", async () => {
  const mockument = getDocument();
  prismaMock.document.findMany.mockResolvedValue([mockument]);
  mockedgetSignedURL.mockImplementation(async () => {
    return "http://s3.fakeland.com/testfile.jpg";
  });
  prismaMock.document.findFirst.mockResolvedValue(mockument);

  await main();

  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: mockument.submissionId,
        originalFilename: mockument.originalFilename,
      },
    })
  );
  expect(prismaMock.document.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        documentId: mockument.documentId,
      },
    })
  );
});

it("tests ignores expired documents", async () => {
  prismaMock.document.findMany.mockResolvedValue([]);
  await main();
  expect(prismaMock.document.findMany).toHaveBeenCalled();
  expect(prismaMock.document.findFirst).not.toHaveBeenCalled();
  expect(prismaMock.document.update).not.toHaveBeenCalled();
});
