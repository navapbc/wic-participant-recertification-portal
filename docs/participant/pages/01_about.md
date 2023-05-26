# About Page

### About this page:

This page contains static content about the process. It's written at a very high level.

### Considerations for other states:

This page may not need to change even if you make changes to the rest of the flow, given how high level it is.

### Development

The About page describes the overall steps process using a USWDS / Trussworks [`<ProcessList>`](https://trussworks.github.io/react-uswds/?path=/story/components-processlist--process-list-default) component

The contents of this page are controlled by two things -

- The layout contained in [app/routes/$localAgency/recertify/about.tsx](../../../participant/app/routes/%24localAgency/recertify/about.tsx)
- The i18next strings for the `"About"` key in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
