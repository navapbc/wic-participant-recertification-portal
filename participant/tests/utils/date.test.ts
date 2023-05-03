import { localizeDateString } from "app/utils/date";

const timezoneMock = function (zone: string) {
  const DateTimeFormat = Intl.DateTimeFormat;
  jest
    .spyOn(global.Intl, "DateTimeFormat")
    .mockImplementation(
      (locale, options) =>
        new DateTimeFormat(locale, { ...options, timeZone: zone })
    );
};

afterEach(() => {
  jest.restoreAllMocks();
});

it("should return a correctly localized date string", async () => {
  timezoneMock("America/Chicago");
  const dateString = "2023-05-03 18:08:38.653+00";
  const result = localizeDateString(dateString);
  expect(result).toStrictEqual("5/3/2023, 1:08:38 PM");
});

it("should return a correctly localized date string in a different timezone", async () => {
  timezoneMock("America/Los_Angeles");
  const dateString = "2023-05-03 18:08:38.653+00";
  const result = localizeDateString(dateString);
  expect(result).toStrictEqual("5/3/2023, 11:08:38 AM");
});

it("should return work if the string is undefined", async () => {
  const result = localizeDateString(undefined);
  expect(result).toMatch(
    /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{1,2}:\d{1,2} (AM|PM)/
  );
});
