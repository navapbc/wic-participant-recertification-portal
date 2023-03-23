/**
 * @jest-environment node
 */
/* eslint-disable jest/no-conditional-expect */

import { prismaMock } from "tests/helpers/prismaMock";
import { getLocalAgency } from "tests/helpers/mockData";
import { validRoute } from "app/utils/redirect";

function makeRequest(path: string) {
  return {
    url: `http://localhost/${path}`,
  } as unknown as Request;
}

it("will not route if it does not have to", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const request = makeRequest(`/${mockAgency.urlId}/recertify`);
  const target = await validRoute(request, { localAgency: mockAgency.urlId });
  expect(target).toBeNull;
});

it("will find a valid agency if one is not in the url", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  prismaMock.localAgency.findFirst.mockResolvedValue(mockAgency);
  const request = makeRequest(`/bogus/recertify`);
  const target = await validRoute(request);
  expect(target).toBe(`/${mockAgency.urlId}/recertify`);
});

it("will find a valid agency a bogus one is in the first urlPart", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  prismaMock.localAgency.findFirst.mockResolvedValue(mockAgency);
  const request = makeRequest(`/bogus`);
  const target = await validRoute(request);
  expect(target).toBe(`/${mockAgency.urlId}/recertify`);
});

it("will use a valid agency even if it is in the first urlPart", async () => {
  let mockAgency = getLocalAgency();
  mockAgency.urlId = "DIFFERENT";
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const request = makeRequest(`${mockAgency.urlId}`);
  const target = await validRoute(request, undefined, true);
  expect(target).toBe(`/${mockAgency.urlId}/recertify`);
});

it("will send the user to the root if asked to", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const request = makeRequest(`/${mockAgency.urlId}/recertify/somewhere/else`);
  const target = await validRoute(
    request,
    { localAgency: mockAgency.urlId },
    true
  );
  expect(target).toBe(`/${mockAgency.urlId}/recertify`);
});

it("will ignore the url if params are present", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const request = makeRequest(`/bogusAgency/recertify/somewhere`);
  const target = await validRoute(request, { localAgency: mockAgency.urlId });
  expect(target).toBe(null);
});

it("will ignore the url if params are present and redirect", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const request = makeRequest(`/bogusAgency/recertify/somewhere`);
  const target = await validRoute(
    request,
    { localAgency: mockAgency.urlId },
    true
  );
  expect(target).toBe("/agency/recertify");
});
