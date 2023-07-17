# Details

## About This Page

Users fill out "participant cards" (a repeatable fieldset) to collect detailed information about participants who are recertifying. This info will both help staff find the participant in M-SPIRIT and ensure we request the right kinds of documents. Because WIC participants do not know their household ID and using EBT # would require additional steps for staff, we will rely on the participant's name and date of birth as the data points staff can use to look up the participant in M-SPIRIT. We ask adjunctive eligibility per participant since it's possible one participant has it and another doesn't.

## Considerations for Other States

If your state is able to surface who is recertifying, for example by using MIS data, then you can avoid this and the /count pages all together and instead surface to the user who is recertifying.

## Development

The Details page renders a number of [`<ParticipantCard>`](../../../participant/app/components/ParticipantCard.tsx) components, initially based on the `?count` parameter in the URL.

Submitted details are stored in the database in a `SubmissionForm` record

The contents of this page are controlled by three things -

- The `?count` parameter in the URL **or** the number of existing participants in the database
- The layout contained in [app/routes/$localAgency/recertify/details.tsx](../../../participant/app/routes/%24localAgency/recertify/details.tsx)
- The i18next strings for the `"Details"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
