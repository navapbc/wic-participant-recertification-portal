#!/bin/bash
# A script to create users in AWS Cognito and create database records for them in the participant database.
# Run from the root of the project like so: ./bin/create-staff-users.sh <env name>
set -euo pipefail

# Positional arguments.
ENV_NAME=$1

# Variables.
# The Cognito process needs a file that maps emails to local agencies. This must be provided.
# ⚠️ Warning! Don't commit this file to the git repo!
EMAIL_FILENAME="staff-emails-to-agencies.tfvars.json"
# The ECS Task process needs a file that maps Cognito UUIDs to local agencies. This is automatically created.
UUID_FILENAME="staff-uuids-to-agencies.json"
USER_POOL_NAME="user_pool_name=wic-prp-staff-${ENV_NAME}"
CLUSTER_NAME="wic-prp-app-${ENV_NAME}"
TASK_DEFINITION_NAME="wic-prp-participant-${ENV_NAME}"
BUCKET_NAME="wic-prp-side-load-${ENV_NAME}"

# Requires a file named `staff-emails-to-agencies.tfvars.json` in the infra/modules/cognito-staff-user dir.
# See infra/modules/cognito-staff-user/staff-emails-to-agencies.tfvars.json.example for an example.

# Create staff users in cognito.
terraform -chdir=infra/modules/cognito-staff-user init
terraform -chdir=infra/modules/cognito-staff-user apply \
  -var-file=$EMAIL_FILENAME \
  -var=$USER_POOL_NAME

# Save output to s3.
terraform -chdir=infra/modules/cognito-staff-user output -json | jq .staff_user_list.value > $UUID_FILENAME
aws s3api put-object \
  --bucket $BUCKET_NAME \
  --key "seed/${UUID_FILENAME}" \
  --body $UUID_FILENAME

# Import staff users into participant database.
# Run as a one-off ECS task.
aws ecs run-task \
  --cluster $CLUSTER_NAME \
  --task-definition $TASK_DEFINITION_NAME \
  --overrides "{ \"containerOverrides\": [{ \"command\": \"npm run seed-staff-users\" }, { \"environment\" : [{ \"S3_BUCKET\": \"${BUCKET_NAME}\" }]}]}"

# Cleanup
rm $UUID_FILENAME