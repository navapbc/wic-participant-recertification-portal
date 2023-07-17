# Testing

## Playwright

We use [Playwright](https://playwright.dev) for our end-to-end tests in this project. You'll find those in the `e2e` directory. As you make changes, add to an existing file or create a new file in the `e2e` directory to test your changes.

(Make sure it has `spec` in the filename!)

### First time setup

You must install browsers for Playwright to use the first time you want to run e2e tests:

```sh
npx playwright install
```

### Running e2e tests

To run these tests locally, run `npm run e2e` which will run a docker composition (`docker-compose.e2e.yml`) to run the following in docker containers:

- Start a postgres database
- Start the Remix application server
- Run the Playwright tests

```sh
npm run e2e
```

> Note: We chose to run playwright inside a docker container because we were experiencing significant pixel drift between snapshots taken on macOS vs snapshots taken in CI using Github Actions.

## Jest Testing

For lower level tests of utilities and individual components, we use `jest`.

To run the Jest tests written, use

```sh
npm run test
```

The prisma database connection is _mocked_ automatically in Jest. You can see an example of how to add mock responses to queries in the [db.connection.test.ts](../participant/tests/utils/db.connection.test.ts).