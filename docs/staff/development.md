# Development, Deployment, and Testing

## Docker

The application is intended to be deployed as a docker container The `Dockerfile` uses a multi-stage build strategy to flexibly build different images needed for different contexts:

- **`dev` image**: This image uses settings that assist in local development, including installing all development packages and running lowdefy in dev mode which will handle hot refreshing (`npx lowdefy dev`)
- **`prod` image**: This image uses a production-ready, stripped down version of the application that does not include development packages and uses a built version of the application run with node (`node ./dist/server.js`)

Files that docker builds should ignore are tracked in `.dockerignore`.

## Local Development

We recommend doing local development in a docker container as well. A `docker-compose.yml` file has been included for creating a container cluster that also starts supporting containers:

- **`lowdefy_dev`:** A development build of the app. This uses the `dev` docker image
- **`lowdefy_prod:`** A production build of the app. This uses the `prod` docker image and is included for final spot testing purposes
- **`postgres`:** A local postgresql database for development purposes. In production, this would be the actual live database that the participant portal writes data to.
- **`s3-local`:** A [minio](https://min.io) container used for local S3-like development
- **`createbuckets`:** An ephemeral container that will create the expected S3 buckets in minio. This container should stop when its done and not be long-running.
- **`remix`:** An ephemeral container that will seed the development database with some entries to test against. This container should stop when its done and not be long-running.

### Usage

1. Make sure [docker](https://www.docker.com) is installed and running. We recommend using [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Run [`docker compose up --build --detach`](https://docs.docker.com/engine/reference/commandline/compose_up/). This command will build all of the docker images, start all of the containers, and then exit (leaving the containers running in the background).
  - Use `docker compose ps` to see the current status of the containers
  - Use `docker compose logs` to view all the docker logs
  - Use `docker compose exec <container name> sh` to execute a shell into any of the containers
  - See the [docker compose cli](https://docs.docker.com/compose/reference) documentation for more details
- Navigate to `localhost:3033` to view the `lowdefy_dev` app
- Run `docker compose down` to stop and remove all of the containers when you are done

## Testing (e2e)

The testing included with the staff portal is very limited. We have included infrastructure for running end-to-end (e2e) testing using [Playwright](https://playwright.dev). Example tests are located in `e2e/`. Playwright configuration is located in `playwright.config.ts`.

The participant portal includes much more robust end-to-end testing. The staff portal leverages the participant portal's e2e testing, including the `/participant/Dockerfile.playwright`.

Both the staff portal and the participant portal have an npm script in `package.json` that allows you to run `npm run e2e`. This will call the `/bin/run-e2e.sh` bash script in, which in turn will execute the `docker-compose.e2e.yml`.

> Note: We chose to run playwright inside a docker container because we were experiencing significant pixel drift between snapshots taken on macOS vs snapshots taken in CI using Github Actions.

## Deployment

This repo includes CI/CD for the staff portal. The `Makefile` is used to support the CI/CD jobs in the `.github/workflows` directory.