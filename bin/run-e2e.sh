#!/bin/bash
# Script to run playwright end-to-end tests in a linux environment via docker containers.
set -eo pipefail

function die() {
  printf '%s\n' "$1" >&2
  exit 1
}

function show_help() {
  echo "Usage:
    run-e2e [-h|--help][-r|--reset-db][-e|--extra-arg <argument>] app command
    app can be: participant staff
    command can be: test update cleanup"
}

function main() {
  # Initialize option variables to avoid bringing in values from env vars.
  command=
  app=
  extra_arg=
  reset_db=false

  # Parse arguments.
  while :; do
    case $1 in
      # Show help.
      -h|--help)
        show_help
        exit
        ;;
      # Handle resetting the database.
      -r|--reset-db)
        reset_db=true
        ;;
      # Handle extra argument that we want to pass to the test function.
      -e|--extra-arg)
        if [ "$2" ]; then
          extra_arg=$2
          shift
        else
          die 'ERROR: "--extra-arg" requires a non-empty option argument.'
        fi
        ;;
      --extra-arg=?*)
        extra_arg=${1#*=}
        ;;
      --extra-arg=)
        die 'ERROR: "--extra-arg" requires a non-empty option argument.'
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

  if [[ "$#" < 2 ]]; then
    die 'ERROR: An app and a command are required.'
  fi

  # Get the app.
  available_apps=(participant staff)
  if ! [[ ${available_apps[*]} =~ $1 ]]; then
    die "ERROR: The app must be one of these: ${available_apps[*]}"
  else
    app=$1
  fi


  # Get the command.
  available_commands=(test update cleanup)
  if ! [[ ${available_commands[*]} =~ $2 ]]; then
    die "ERROR: The command must be one of these: ${available_commands[*]}"
  else
    command=$2
  fi

  if [[ "$#" > 2 ]]; then
    echo 'WARNING: This command accepts only 2 positional arguments and ignores the rest' >&2
  fi

  if [[ "cleanup" == $command ]]; then
    cleanup
  else
    run_db
    if $reset_db ; then
      reset_db $app
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
  docker compose -f docker-compose.e2e.yml up --build --wait database-e2e
}

function reset_db() {
  app=$1
  printf 'Resetting database'
  if [[ "participant" == $app ]]; then
    printf ' by running an ephemeral container...\n'
    docker compose -f docker-compose.e2e.yml run --build --rm app-e2e npm run dev:dbreset
  elif [[ "staff" == $app ]]; then
    printf ' by starting the dedicated reset container...\n'
    docker compose -f docker-compose.e2e.yml up --build --wait dbreset-e2e
  fi
}

function run_app() {
  # Start the application and wait until it's ready
  echo "Starting app to test against..."
  docker compose -f docker-compose.e2e.yml up --build --wait app-e2e
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