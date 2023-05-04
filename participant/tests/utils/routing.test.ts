/**
 * @jest-environment node
 */
import { pick } from "lodash";
import type { ContactData, Participant } from "~/types";
import { routeRelative, routeFromChanges, checkRoute } from "~/utils/routing";
const baseRequest = {
  url: "http://localhost:3000/gallatin/recertify/somewhere",
} as Request;

it("generates a relative URL", () => {
  const targetUrl = routeRelative(baseRequest, "elsewhere");
  expect(targetUrl).toBe("/gallatin/recertify/elsewhere");
});

const participantData = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Bamboozled",
  lastName: "Cheesemuffin",
  relationship: "grandchild",
};

const changes = [
  {
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "no" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
  {
    changes: { idChange: "no", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
  {
    changes: { idChange: "yes", addressChange: "yes" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  },
];

it.each(changes)(
  "routes to upload if there are changes or NO adjunctive eligibility: %s",
  (change) => {
    const targetUrl = routeFromChanges(baseRequest, change);
    expect(targetUrl).toBe("/gallatin/recertify/upload");
  }
);

it("does not route to /upload if there are no changes and adjunctive eligibility", () => {
  const noChangesAndAdjunctive = {
    changes: { idChange: "no", addressChange: "no" },
    participant: [{ ...participantData, adjunctive: "yes" } as Participant],
  };
  const targetUrl = routeFromChanges(baseRequest, noChangesAndAdjunctive);
  expect(targetUrl).toBe("/gallatin/recertify/contact");
});

it("is OK to land on the index or about pages with no data", () => {
  const rootCheck = checkRoute(
    { url: "http://localhost:3000/gallatin/recertify" } as Request,
    {}
  );
  expect(rootCheck).toBe(true);
  const aboutCheck = checkRoute(
    { url: "http://localhost:3000/gallatin/recertify/about" } as Request,
    {}
  );
  expect(aboutCheck).toBe(true);
});

it("is OK to be on the name page without name data", () => {
  const nameCheck = checkRoute(
    {
      url: "http://localhost:3000/gallatin/recertify/name",
    } as Request,
    {}
  );
  expect(nameCheck).toBe(true);
});

const nameTooFar = [
  "count",
  "details",
  "changes",
  "upload",
  "review",
  "confirm",
];

it.each(nameTooFar)(
  "bounces me back to name if i try to go further without name data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    expect(() => {
      checkRoute({ url: target } as Request, {});
    }).toThrow("/gallatin/recertify/name");
  }
);

it("is OK to be on the count page without count data", () => {
  const nameData = { name: pick(participantData, ["firstName", "lastName"]) };
  const countCheck = checkRoute(
    {
      url: "http://localhost:3000/gallatin/recertify/count",
    } as Request,
    nameData
  );
  expect(countCheck).toBe(true);
});

const countTooFar = ["details", "changes", "upload", "review", "confirm"];

it.each(countTooFar)(
  "bounces me back to count if i try to go further without count data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const nameData = { name: pick(participantData, ["firstName", "lastName"]) };
    expect(() => {
      checkRoute({ url: target } as Request, nameData);
    }).toThrow("/gallatin/recertify/count");
  }
);

it("is OK to be on the details page without participant data", () => {
  const submissionData = {
    name: pick(participantData, ["firstName", "lastName"]),
    count: { householdSize: 1 },
  };
  const detailsCheck = checkRoute(
    {
      url: "http://localhost:3000/gallatin/recertify/details",
    } as Request,
    submissionData
  );
  expect(detailsCheck).toBe(true);
});

const participantTooFar = ["changes", "upload", "review", "confirm"];

it.each(participantTooFar)(
  "bounces me back to details if i try to go further without participant data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const submissionData = {
      name: pick(participantData, ["firstName", "lastName"]),
      count: { householdSize: 1 },
    };
    expect(() => {
      checkRoute({ url: target } as Request, submissionData);
    }).toThrow("/gallatin/recertify/details");
  }
);

it("is OK to be on the changes page without changes data", () => {
  const submissionData = {
    name: pick(participantData, ["firstName", "lastName"]),
    count: { householdSize: 1 },
    participant: [participantData as Participant],
  };
  const changesCheck = checkRoute(
    { url: "http://localhost:3000/gallatin/recertify/changes" } as Request,
    submissionData
  );
  expect(changesCheck).toBe(true);
});

const changesTooFar = ["upload", "review", "confirm"];

it.each(changesTooFar)(
  "bounces me back to changes if i try to go further without changes data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const submissionData = {
      name: pick(participantData, ["firstName", "lastName"]),
      count: { householdSize: 1 },
      participant: [participantData as Participant],
    };
    expect(() => {
      checkRoute({ url: target } as Request, submissionData);
    }).toThrow("/gallatin/recertify/changes");
  }
);

it("is OK to be on the upload page without documents data", () => {
  const submissionData = {
    name: pick(participantData, ["firstName", "lastName"]),
    count: { householdSize: 1 },
    participant: [participantData as Participant],
    changes: { idChange: "yes", addressChange: "no" },
  };
  const uploadCheck = checkRoute(
    { url: "http://localhost:3000/gallatin/recertify/upload" } as Request,
    submissionData
  );
  expect(uploadCheck).toBe(true);
});

const uploadTooFar = ["contact", "review", "confirm"];

it.each(uploadTooFar)(
  "bounces me back to upload if i try to go further without documents data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const submissionData = {
      name: pick(participantData, ["firstName", "lastName"]),
      count: { householdSize: 1 },
      participant: [participantData as Participant],
      changes: { idChange: "yes", addressChange: "no" },
    };
    expect(() => {
      checkRoute({ url: target } as Request, submissionData);
    }).toThrow("/gallatin/recertify/upload");
  }
);

it("is OK to be on the contact page without contact data", () => {
  const submissionData = {
    name: pick(participantData, ["firstName", "lastName"]),
    count: { householdSize: 1 },
    participant: [participantData as Participant],
    changes: { idChange: "yes", addressChange: "no" },
    documents: [
      {
        s3Key: "somewhere",
        s3Url: "somewhere",
        originalFilename: "file.png",
      },
    ],
  };
  const contactCheck = checkRoute(
    { url: "http://localhost:3000/gallatin/recertify/contact" } as Request,
    submissionData
  );
  expect(contactCheck).toBe(true);
});

const contactTooFar = ["review", "confirm"];

it.each(contactTooFar)(
  "bounces me back to contact if i try to go further without contact data",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const submissionData = {
      name: pick(participantData, ["firstName", "lastName"]),
      count: { householdSize: 1 },
      participant: [participantData as Participant],
      changes: { idChange: "yes", addressChange: "no" },
      documents: [
        {
          s3Key: "somewhere",
          s3Url: "somewhere",
          originalFilename: "file.png",
        },
      ],
    };
    expect(() => {
      checkRoute({ url: target } as Request, submissionData);
    }).toThrow("/gallatin/recertify/contact");
  }
);

const okToWanderBack = [
  "about",
  "name",
  "count",
  "details",
  "changes",
  "upload",
  "contact",
  "review",
];

it.each(okToWanderBack)(
  "is okay to wander back without getting redirected",
  (page) => {
    const target = `http://localhost:3000/gallatin/recertify/${page}`;
    const submissionData = {
      name: pick(participantData, ["firstName", "lastName"]),
      count: { householdSize: 1 },
      participant: [participantData as Participant],
      changes: { idChange: "yes", addressChange: "no" },
      documents: [
        {
          s3Key: "somewhere",
          s3Url: "somewhere",
          originalFilename: "file.png",
        },
      ],
      contact: { phoneNumber: "1234567890" } as ContactData,
    };
    const check = checkRoute({ url: target } as Request, submissionData);
    expect(check).toBe(true);
  }
);
