#!/bin/bash

# This script is intended to be used in the rare case that the ECS task definition needs
# to be updated. By default, terraform is instructed to ignore the task definition after
# initial creation. This is done using `lifecycle` and `ignore_changes` in
# /infra/modules/service/main.tf.
#
# Sometimes it's necessary to update the ECS task definition. To do so:
# 1. Run this script to retrieve the most recent image tags for each application:
#    `./use-most-recent-image-tags.sh`
# 2. Move the .tfvars file to the environment you want to update:
#    `mv image_tags.tfvars infra/app/envs/dev`
# 3. Temporarily disable the lifecycle ignore by editing /infra/modules/service/main.tf
#    and commenting the appropriate line in aws_ecs_service.app.
# 4. Apply the terraform changes:
#    `cd infra/app/envs/dev && terraform apply -var-file="image_tags.tfvars`
# 5. Uncomment the line from step 3 in aws_ecs_service.app in /infra/modules/service/main.tf
#
# Note: There are occasions when the image tag to deploy should NOT be the most recently
#       built image, such as avoiding deploying a dev image to prod! In that case,
#       you probably shouldn't be updating the ECS task definition anyway! If you still
#       need to, then manually set the correct image tag in the image_tags.tfvars file!

set -euo pipefail

if ! type aws &> /dev/null; then
  echo "The aws cli tool must be installed. See https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

if ! type jq &> /dev/null; then
  echo "The jq must be installed. See https://stedolan.github.io/jq/download/"
  exit 1
fi


function main() {
  ENV_NAME=$1

  echo "Using environment: ${ENV_NAME}"
  rm -f -- image_tags.tfvars
  getImageTag "participant"
  getImageTag "staff"
  getImageTag "analytics"
  echo "...Done!"
}

function getImageTag() {
  APP_NAME=$1
  echo "Getting task definition for ${APP_NAME}..."
  task_definition_arn=$(aws ecs describe-task-definition --task-definition "wic-prp-${APP_NAME}-${ENV_NAME}" | jq '.taskDefinition.taskDefinitionArn')
  echo "Getting image tag for task definition ${task_definition_arn}..."
  image_tag=$(aws ecs describe-task-definition --task-definition "wic-prp-${APP_NAME}-${ENV_NAME}" | jq '.taskDefinition.containerDefinitions[0].image | split(":")[1]' --raw-output)
  echo "Using image tag ${image_tag}..."
  echo "${APP_NAME}_image_tag=\"$image_tag\"" >> image_tags.tfvars
  echo ""
}

main "$@"