# Upload

### About this page:

​​We use the participant's situation to determine which kinds of documents, if any, they need to provide:

- If they don't have adjunctive eligibility, they always need to upload proof of income.
- If they moved, they need to provide proof of address.
- If they changed their name and/or their previous ID doc expired, they need to provide new proof of identity.

### Considerations for other states:

What are your policies around verifying identity and address?
If you require documents in all scenarios, you may be able to simplify this document upload flow.

### Development

The Upload page renders a [`<FileUploader>`](../../../participant/app/components/FileUploader.tsx) component, as well as [`<FilePreview>`](../../../participant/app/components/FilePreview.tsx) components for files already uploaded.

This page will be **skipped** if all users entered on the `Details` page have adjunctive eligibility, and if there were no changes (all "no" answers) on the `Changes` page.

Submitted details are stored in the database in an equal number of `Document` records, and file objects are stored in S3

The contents of this page are controlled by three things -

- Files uploaded previously and rerendered as `<FilePreview>` components
- The layout contained in [app/routes/$localAgency/recertify/upload.tsx](../../../participant/app/routes/%24localAgency/recertify/upload.tsx)
- The i18next strings for the `"Upload"` and `"FileUploader"` keys in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
