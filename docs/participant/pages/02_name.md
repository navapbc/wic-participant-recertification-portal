# Name

### About this page:

This page collects the PRP user's name, so WIC staff know who is filling out the form.

### Considerations for other states:

We assume all states will need to know who is filling out the form, so this page likely won't need major changes

### Development

The Name page collects the details for the individual completing the form.

This page uses a [`<NameInput>`](../../../participant/app/components/NameInput.tsx) component
to collect the name details, and stores it in the database in a `SubmissionForm` record

The contents of this page are controlled by two things -

- The layout contained in [app/routes/$localAgency/recertify/name.tsx](../../../participant/app/routes/%24localAgency/recertify/name.tsx)
- The i18next strings for the `"Name"` and `"NameInput"` keys in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
