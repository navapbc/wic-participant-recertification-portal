# Review

## About This Page

We allow users to review their inputs and selections and offer them the choice to make any changes to their answers to ensure accuracy of the submitted information.

## Development

The Review page renders all previous page data stored in `SubmissionForm` (and a count of `Document` records) in
a special component (not in Storybook) called a [`<SubmissionForm>`](../../../participant/app/components/SubmissionForm.tsx)

Edit links are rendered, jumping the individual back to the appropriate form pages for [Name](../../../participant/app/routes/%24localAgency/recertify/name.tsx), [Details](../../../participant/app/routes/%24localAgency/recertify/details.tsx), [Changes](../../../participant/app/routes/%24localAgency/recertify/changes.tsx), [Upload](../../../participant/app/routes/%24localAgency/recertify/upload.tsx), or [Contact](../../../participant/app/routes/%24localAgency/recertify/contact.tsx)

Clicking "Submit My Information" marks the `Submission` record as completed, and prevents further changes
from being made to the `Submission`, `SubmissionForm`, or `Document` for that `SubmissionID`

The contents of this page are controlled by four things -

- The database contents for `SubmissionForm` and `Documents`
- The layout in the component [`<SubmissionForm>`](../../../participant/app/components/SubmissionForm.tsx)
- The layout contained in [app/routes/$localAgency/recertify/review.tsx](../../../participant/app/routes/%24localAgency/recertify/review.tsx)
- The i18next strings for the `"Review"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
