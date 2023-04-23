#!/bin/bash
set -euo pipefail

ENV_NAME=$1
# PROJECT_NAME=$1
# APP_NAME=$2
# IMAGE_TAG=$4
# INFRA_APP_NAME=$5

# Requires a file named `staff-emails-to-agencies.tfvars.json` in the infra/modules/cognito-staff-user dir.
# See infra/modules/cognito-staff-user/staff-emails-to-agencies.tfvars.json.example for an example.

# Create staff users in cognito.
terraform -chdir=infra/modules/cognito-staff-user init
terraform -chdir=infra/modules/cognito-staff-user apply -var-file=staff-emails-to-agencies.tfvars.json -var="user_pool_name=wic-prp-staff-${ENV_NAME}"

# Save output to s3.
terraform -chdir=infra/modules/cognito-staff-user output -json | jq .staff_user_list.value > staff-uuids-to-agencies.json
aws s3api put-object \
  --bucket "wic-prp-side-load-${ENV_NAME}" \
  --key "seed/staff-uuids-to-agencies.json" \
  --body staff-uuids-to-agencies.json

# Import staff users into participant database.
# aws ecs run-task \
#   --cluster "wic-prp-app-${ENV_NAME}" \
#   --task-definition "wic-prp-participant-${ENV_NAME}" \
#   --overrides '{ "containerOverrides": [{ "command": "npm run seed-staff-users" }, { "environment" : [{ "S3_BUCKET": "wic-prp-side-load-${ENV_NAME}" }]}]}'

# Cleanup
rm staff-uuids-to-agencies.json