# Remix Shoegaze Stack

![The Remix Shoegaze Stack](https://user-images.githubusercontent.com/723391/222034048-30f0bc0b-aff7-439c-a0d3-5536fefc57a1.png)

Learn more about [Remix Stacks](https://remix.run/stacks).

```
npx create-remix@latest --template microwavenby/shoegaze-stack
```

## What's in the stack

- [GitHub Actions](https://github.com/features/actions) for storybook deploy, jest and playwright testing
- Database ORM with [Prisma](https://prisma.io)
- Site-wide Internationalization support with [i18next](https://react.i18next.com/) and [remix-i18next](https://github.com/sergiodxa/remix-i18next)
- Static component and page stories with [Storybook](https://storybook.js.org/)
- Styling with [US Web Design System](https://designsystem.digital.gov/)
- End-to-end testing with [Playwright](https://playwright.dev/)
- Unit testing with [Jest](https://jestjs.io) and [Testing Library](https://testing-library.com)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)

Not a fan of bits of the stack?

Fork it, change it, and use `npx create-remix --template your/repo`! Make it your own.

# Quickstart

## Development

- This step only applies if you've opted out of having the CLI install dependencies for you:

  ```sh
  npm install -D
  ```

- Start the Postgres Database in [Docker](https://www.docker.com/get-started):

  ```sh
  npm run dev:startdb
  ```

  > **Note:** This will start a database container on the default Postgres port 5432. Please adjust if you have another server on your computer

  > This will also run any prisma migrations, and seed the database

- Start dev server:

  ```sh
  npm run dev:remix
  ```

  This starts your app in development mode, rebuilding assets on file changes.

- Run all of the above, plus `npm run css`

  If you use the shortcut `dev`, the database will be started, CSS compiled, and then the remix dev server started

  ```sh
  npm run dev
  ```

## CSS

- If you change the theme settings in `styles/` you will need to build the css

  You can run the sass build and the postcss by using:

  ```sh
  npm run css
  ```

  This is two npm commands back to back:

  ```sh
  npm run css:build
  npm run css:post
  ```

- Watch for CSS changes

  If you are making multiple CSS changes, you can run the `css:dev` command to recompile CSS on changes

  ```sh
  npm run css:dev
  ```

## Relevant code:

This app is a skeleton, with some of the tricky parts of getting Jest, Playwright, Prisma, Storybook
and Remix to play together sorted out.

### Database Connectivity

- An example Prisma schema [prisma/schema.prisma](./prisma/schema.prisma)
- An skeleton Prisma database seed command [prisma/seed.ts](./prisma/seed.ts)
- A database connection object [app/utils/db.connection.ts](./app/utils/db.connection.ts)

### Remix code

- A layout Component to render a header + footer [app/components/Layout.tsx](./app/components/Layout.tsx)
- An Index route [app/routes/index.tsx](./app/routes/index.tsx)
- A healthcheck [app/routes/healthcheck.tsx](./app/routes/healthcheck.tsx)
- An example i18n file [public/locales/en/common.json](./public/locales/en/common.json)

### Jest Testing framework

- A mock for Prisma [tests/helpers/prismaMock.ts](./tests/helpers/prismaMock.ts)
- Tests for the 2 components [tests/components](./tests/components/)
- An example of using the Prisma mock [tests/utils/db.connection.test.ts](./tests/utils/db.connection.test.ts)

### Playwright e2e Testing

- Tests for the Index page [e2e/routes/index.spec.ts](./e2e/routes/index.spec.ts)
- Tests for the Healthcheck [e2e/routes/healthcheck.spec.ts](./e2e/routes/healthcheck.spec.ts)

## Deployment

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging environments.

Prior to your first deployment, you'll need to do a few things:

- Initialize Git.

  ```sh
  git init
  ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

## Testing

### Playwright

We use Playwright for our End-to-End tests in this project. You'll find those in the `e2e` directory. As you make changes, add to an existing file or create a new file in the `e2e` directory to test your changes.

(Make sure it has `spec` in the filename!)

#### First time setup

You must install browsers for Playwright to use the first time you want to run e2e tests:

```sh
npx playwright install
```

#### Running e2e tests

To run these tests locally, run `npm run e2e` which will start a Postgres database on a non-standard port (5556), start the Remix application server, but then run the browser tests on your local machine. This was a balance of complexity; it _is_ technically possible to have a Playwright container with browsers installed within it.

```sh
npm run e2e
```

This database server will stay running between e2e runs (but will start if needed when you run `npm run e2e`)

Migrations and a full database reset will happen to this database on every e2e test run; if you need your data preserved, use the Postgres server defined in `./docker-compose.yml` (or another properly configured Postgres server)

### Jest Testing

For lower level tests of utilities and individual components, we use `jest`.

To run the Jest tests written, use

```sh
npm run test
```

The prisma database connection is _mocked_ automatically in Jest. You can see an example of how to
add mock responses to queries in the [db.connection.test.ts](tests/utils/db.connection.test.ts)

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

```sh
npm run typecheck
```

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

```sh
npm run lint
```

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save.

There's also a `npm run format` script you can run to format all files in the project.

```sh
npm run format
```
