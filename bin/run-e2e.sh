#!/bin/bash
# Script to run playwright end-to-end tests in a linux environment via docker containers.
set -euo pipefail

COMMAND=$1
EXTRA_ARG=${2:-""}

available_commands=(test update cleanup)

if ! [[ ${available_commands[*]} =~ $COMMAND ]]; then
  echo "The argument must be one of these: ${available_commands[*]}"
  exit 1
fi

if [[ "test" == $COMMAND ]]; then
  # Start the database and wait until it's ready
  echo "Starting database..."
  docker compose -f docker-compose.e2e.yml up --build --wait database-e2e
  # Start the S3 local server and wait until it's ready
  echo "Starting S3 Localstack..."
  docker compose -f docker-compose.e2e.yml up --build --wait s3_local-e2e
  # Start the application and wait until it's ready
  echo "Starting app to test against..."
  docker compose -f docker-compose.e2e.yml up --build --wait app-e2e
  # Start Playwright and run the tests in a one-off container
  echo "Running playwright tests..."
  docker compose -f docker-compose.e2e.yml run --build --rm playwright npx playwright test --retries=3 --reporter=list ${EXTRA_ARG}
  echo "...Done!"
fi

if [[ "update" == $COMMAND ]]; then
  # Start the database and wait until it's ready
  echo "Starting database..."
  docker compose -f docker-compose.e2e.yml up --build --wait database-e2e
  # Start the S3 local server and wait until it's ready
  echo "Starting S3 Localstack..."
  docker compose -f docker-compose.e2e.yml up --build --wait s3_local-e2e
  # Start the application and wait until it's ready
  echo "Starting app to test against..."
  docker compose -f docker-compose.e2e.yml up --build --wait app-e2e
  # Start Playwright and run the tests in a one-off container
  echo "Updating playwright snapshots..."
  docker compose -f docker-compose.e2e.yml run --build --rm playwright npx playwright test --update-snapshots --reporter=list
  echo "...Done!"
fi

if [[ "cleanup" == $COMMAND ]]; then
  # Remove all the docker containers
  echo "Removing e2e containers..."
  docker compose -f docker-compose.e2e.yml down
  echo "...Done!"
fi
