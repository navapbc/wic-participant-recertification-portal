# Count

### About these pages:

User research showed that WIC participants don't distinguish between household members directly enrolled in WIC and authorized representatives. However, we only want to collect detailed information about WIC participants who are recertifying. So the count page includes content and nudges to help the user understand whose info we need. We use the /count page to identify how many people are recertifying from their household, which creates that number of "participant cards" on the /details page. The number entered in /count is not saved anywhere, it's just to generate participant cards. Users can remove the number of participant cards on the /details page.

### Considerations for other states:

If your state is able to surface who is recertifying, for example by using MIS data, then you can avoid this and the /count pages all together and instead surface to the user who is recertifying.

### Development

The Count page collects a number of individuals being recertified, to populate the [Details](../../../participant/app/routes/%24localAgency/recertify/details.tsx) form

This page uses a [`<TextField>`](../../../participant/app/components/TextField.tsx) component
to collect the count, and stores it in the database in a `SubmissionForm` record

It's of note that for this page, after details for participants are entered on the [Details](../../../participant/app/routes/%24localAgency/recertify/details.tsx) form,
we do not allow the individual using the form to edit this value. Changing this behavior could result in unexpected
outcomes for the applicant.

The contents of this page are controlled by two things -

- The layout contained in [app/routes/$localAgency/recertify/count.tsx](../../../participant/app/routes/%24localAgency/recertify/count.tsx)
- The i18next strings for the `"Count"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
