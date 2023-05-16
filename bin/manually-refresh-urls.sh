#!/bin/bash
# This script refreshes the S3 presigned urls saved to the participant database.
# Example: ./manually-refresh-urls dev 30
set -euo pipefail

# Positional arguments.
# The environment in which to refresh urls.
ENV_NAME=$1
# The renewal threshold in seconds. If a presigned url is older than this many seconds, it is renewed.
RENEWAL_THRESHOLD=$2

CLUSTER_NAME="wic-prp-app-${ENV_NAME}"
SERVICE_NAME="wic-prp-participant-${ENV_NAME}"
TASK_DEFINITION_NAME="wic-prp-participant-${ENV_NAME}"
CONTAINER_NAME="wic-prp-participant-${ENV_NAME}"

NETWORK_CONFIG=$(aws ecs describe-services --cluster $CLUSTER_NAME --service $SERVICE_NAME | jq -r '.services[0].networkConfiguration')

CONTAINER_OVERRIDES="{ \"containerOverrides\": [{ \"name\": \"${CONTAINER_NAME}\", \"command\": [\"npm\", \"run\", \"refresh-s3-urls\"], \"environment\" : [{ \"name\": \"S3_PRESIGNED_URL_RENEWAL_THRESHOLD\", \"value\": \"${RENEWAL_THRESHOLD}\" }]}]}"

aws ecs run-task \
  --cluster $CLUSTER_NAME \
  --task-definition $TASK_DEFINITION_NAME \
  --overrides "${CONTAINER_OVERRIDES}" \
  --network-configuration "${NETWORK_CONFIG}" \
  --launch-type="FARGATE" \
  --platform-version="1.4.0"