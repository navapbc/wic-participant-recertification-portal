# Index Page

The Index page is the landing page for the application.

### About this page:

This page contains static content about who is eligible to use this recertification portal.

### Considerations for other states:

We predict state agencies may make content and logo changes on this page
Also, state agencies would need to remove the portal survey, or replace it with a new survey

### Development

Remix allows us to use URL parameters in our paths, so the file on our filesystem is [app/routes/$localAgency/recertify/index.tsx](../../../participant/app/routes/%24localAgency/recertify/index.tsx)

The `$localAgency` parameter associates the participant's submission with a `LocalAgency` database record, using its `urlId` property.

Invalid `urlId` values will be redirected to the first database record in the `LocalAgency` table, and an empty `LocalAgency` table will result in an error.

The contents of this page are controlled by two things -

- The layout contained in [app/routes/$localAgency/recertify/index.tsx](../../../participant/app/routes/%24localAgency/recertify/index.tsx)
- The i18next strings for the `"Index"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
