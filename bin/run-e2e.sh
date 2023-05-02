#!/bin/bash
# Script to run playwright end-to-end tests in a linux environment via docker containers.
set -eo pipefail

function die() {
  printf '%s\n' "$1" >&2
  exit 1
}

function show_help() {
  echo "Usage:
    run-e2e [-h|--help] command [<optional-argument-to-pass-to-playwright>]
    command must be: test update cleanup
    must be run from within the participant or staff directory"
}

function main() {
  # Initialize option variables to avoid bringing in values from env vars.
  command=
  app=
  extra_arg=""

  # Parse arguments.
  while :; do
    case $1 in
      # Show help.
      -h|--help)
        show_help
        exit
        ;;
      --)
        shift
        break
        ;;
      -?*)
        printf 'WARNING: Unknown option (ignored): %s\n' "$1" >&2
        ;;
      *)
        break
    esac
    shift
  done

  # Get the command.
  if [[ "$#" < 1 ]]; then
    die 'ERROR: A command is required.'
  fi

  available_commands=(test update cleanup)
  if ! [[ ${available_commands[*]} =~ $1 ]]; then
    die "ERROR: The command must be one of these: ${available_commands[*]}"
  else
    command=$1
  fi

  if [[ "$#" > 2 ]]; then
    echo 'WARNING: This command accepts only 2 positional arguments and ignores the rest' >&2
  fi

  extra_arg=$2

  # Get the app.
  available_apps=(participant staff)
  app=${PWD##*/}
  if ! [[ ${available_apps[*]} =~ $app ]]; then
    die "ERROR: Must be run from one of these directories: ${available_apps[*]}"
  fi

  # Run the command.
  if [[ "cleanup" == $command ]]; then
    cleanup
  else
    run_db
    create_buckets
    if [[ "staff" == $app ]]; then
      reset_db
    fi
    run_app
    if [[ "test" == $command ]]; then
      test $extra_arg
    elif [[ "update" == $command ]]; then
      update_snapshots
    fi
  fi
  echo "...Done!"
}

function run_db() {
  # Start the database and wait until it's ready
  echo "Starting database..."
  docker compose -f docker-compose.e2e.yml up --build --wait database
}

# Only necessary for staff portal
function reset_db() {
  printf 'Resetting database by starting the dedicated reset container...\n'
  docker compose -f docker-compose.e2e.yml up --build --wait dbreset-e2e
}

function run_app() {
  # Start the application and wait until it's ready
  echo "Starting app to test against..."
  docker compose -f docker-compose.e2e.yml up --build --wait app-e2e
}

function create_buckets() {
  # Ensure bucket exists
  echo "🪣 Ensuring participant-uploads bucket exists.."
  docker compose -f docker-compose.e2e.yml up createbuckets
}

function test() {
  extra_arg=$1
  # Start Playwright and run the tests in a one-off container
  printf 'Running playwright tests...'
  if [[ $extra_arg != "" ]]; then
    printf ' with extra argument: %s' "$extra_arg"
  fi
  printf '\n'
  docker compose -f docker-compose.e2e.yml run --build --rm playwright npx playwright test --retries=3 --reporter=list ${extra_arg}
}

function update_snapshots() {
  echo "Updating playwright snapshots..."
  docker compose -f docker-compose.e2e.yml run --build --rm playwright npx playwright test --update-snapshots --reporter=list
}

function cleanup() {
  # Remove all the docker containers and volumes
  echo "Removing e2e containers..."
  docker compose -f docker-compose.e2e.yml down --volumes
}

main "$@"
