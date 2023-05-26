# Changes

### About this page:

This question allows us to understand if something has changed with the WIC participant that would require them to upload new proof of address/identity docs. Montana WIC only requires documentation if these two scenarios have changed, or if any participant lacks adjunctive eligibility.

### Considerations for other states:

When do you require recertifying WIC participants to upload documents? If only certain scenarios, what questions can you replace with these to understand those participants?
For states that always require documents during recertification, are these questions helpful for local staff? Or, can you remove these questions and logic altogether?

### Development

The Changes page renders two [`<ChoiceGroupInput>`](../../../participant/app/components/ChoiceGroupInput.tsx) components with yes / no questions

Submitted details are stored in the database in a `SubmissionForm` record

The contents of this page are controlled by two things -

- The layout contained in [app/routes/$localAgency/recertify/changes.tsx](../../../participant/app/routes/%24localAgency/recertify/changes.tsx)
- The i18next strings for the `"Changes"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
