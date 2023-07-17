# Confirm

## About This Page

This page confirms the submission and shows content about next steps. It contains an optional user survey for feedback about their experience. It shows the user's submitted information.

### Considerations for states:

- You may want to update next steps content with agency specific next steps.
- You can replace your own survey link with your own to collect user feedback.

## Development

The Confirm page renders all previous page data stored in `SubmissionForm` (and a count of `Document` records) in
a special component (not in Storybook) called a [`<SubmissionForm>`](../../../participant/app/components/SubmissionForm.tsx)

The applicant cannot edit this page, and navigation will ask the individual if they would like to reset their cookie
to allow completing the form a second (or nth) time.

The contents of this page are controlled by four things -

- The database contents for `SubmissionForm` and `Documents`
- The layout in the component [`<SubmissionForm>`](../../../participant/app/components/SubmissionForm.tsx)
- The layout contained in [app/routes/$localAgency/recertify/confirm.tsx](../../../participant/app/routes/%24localAgency/recertify/confirm.tsx)
- The i18next strings for the `"Review"` key and the `"Confirm"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
