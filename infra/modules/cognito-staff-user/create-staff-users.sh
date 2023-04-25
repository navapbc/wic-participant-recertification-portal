#!/bin/bash
# This script creates users in AWS Cognito and create database records for them in the participant database.
# It requires 2 positional arguments:
# - the environment to create the users in
# - the path to a json file that maps local agencies and emails (which are used as the username).
# See below for more details.
# Example: ./create-staff-users dev /tmp/email.json
# @TODO: This might possibly be better if this were pulled down from an S3 bucket.
set -euo pipefail

# Positional arguments.
# The environment for the users to be created in.
ENV_NAME=$1

# The Cognito process needs a file with the emails for each local agency. This must be provided.
# Do not commit this file to git! Pass in the path to a file of the format:
# {
#   "user_emails": {
#     "<email>": "<local agency>"
# }
#
# For example:
# {
#   "user_emails": {
#     "apple@wic.gov": "gallatin",
#     "carrot@wic.gov": "gallatin",
#     "eggplant@wic.gov": "gallatin",
#     "banana@wic.gov": "missoula",
#     "daikon@wic.gov": "missoula",
# }
EMAIL_FILENAME=$2

# Variables.
UUID_FILENAME="staff-uuids-to-agencies.json"
USER_POOL_NAME="wic-prp-staff-${ENV_NAME}"
CLUSTER_NAME="wic-prp-app-${ENV_NAME}"
TASK_DEFINITION_NAME="wic-prp-participant-${ENV_NAME}"
CONTAINER_NAME="wic-prp-participant-${ENV_NAME}"
SERVICE_NAME="wic-prp-participant-${ENV_NAME}"
BUCKET_NAME="wic-prp-side-load-${ENV_NAME}"


# # Create staff users in cognito.
echo "Selecting workspace ${ENV_NAME}..."
terraform workspace select $ENV_NAME
echo "Running terraform init..."
terraform init

echo "Running terraform apply..."
terraform apply \
  -var="environment_name=${ENV_NAME}" \
  -var-file=$EMAIL_FILENAME \
  -var="user_pool_name=${USER_POOL_NAME}"

# Save output to s3.
# The ECS Task process needs a file that maps Cognito UUIDs to local agencies. This is automatically created and
# temporarily saved locally. It will be cleaned up as the last step.
terraform output -json | jq .staff_user_list.value > $UUID_FILENAME
echo "Uploading seed file to s3..."
aws s3api put-object \
  --bucket $BUCKET_NAME \
  --key "seed/${UUID_FILENAME}" \
  --body $UUID_FILENAME

NETWORK_CONFIG=$(aws ecs describe-services --cluster $CLUSTER_NAME --service $SERVICE_NAME | jq -r '.services[0].networkConfiguration')
# @TODO This is very ugly, but also totally works. Cleanup in future.
CONTAINER_OVERRIDES="{ \"containerOverrides\": [{ \"name\": \"${CONTAINER_NAME}\", \"command\": [\"npm\", \"run\", \"seed-staff-users\"], \"environment\" : [{ \"name\": \"S3_BUCKET\", \"value\": \"${BUCKET_NAME}\" }]}]}"

# Import staff users into participant database.
# Run as a one-off ECS task.
# Logs can be viewed in Cloudwatch.
echo "Running one-off ecs task..."
aws ecs run-task \
  --cluster $CLUSTER_NAME \
  --task-definition $TASK_DEFINITION_NAME \
  --overrides "${CONTAINER_OVERRIDES}" \
  --network-configuration "${NETWORK_CONFIG}" \
  --launch-type="FARGATE" \
  --platform-version="1.4.0"

# Cleanup
echo "Removing temporary file..."
rm $UUID_FILENAME

echo "... Done!"