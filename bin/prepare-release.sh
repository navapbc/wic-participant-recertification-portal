#!/bin/bash
# Note: This script only works in a Github Action due using $GITHUB_OUTPUT
set -euo pipefail

PROJECT_NAME=$1
APP_NAME=$2
ENV_NAME=$3
IMAGE_TAG=$4
INFRA_APP_NAME=$5

echo "init build-repository"

# Need to init module when running in CD since GitHub actions does a fresh checkout of repo
terraform -chdir=infra/$INFRA_APP_NAME/build-repository init
IMAGE_REPOSITORY_URL=$(terraform -chdir=infra/$INFRA_APP_NAME/build-repository output -raw "${APP_NAME}_image_repository_url")

echo "init env"

terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME init
SERVICE_NAME=$(terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME output -raw "${APP_NAME}_service_name")
CLUSTER_NAME=$(terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME output -raw cluster_name)

# Set env vars to output the arguments that are needed for:
# - aws-actions/amazon-ecs-render-task-definition
# - aws-actions/amazon-ecs-deploy-task-definition
echo "ecs_task_definition=infra/$INFRA_APP_NAME/modules/service/container-definitions.json.tftpl" >> $GITHUB_OUTPUT
echo "container_name=$SERVICE_NAME" >> $GITHUB_OUTPUT
echo "image=$IMAGE_REPOSITORY_URL:$IMAGE_TAG" >> $GITHUB_OUTPUT
echo "service_name=$SERVICE_NAME" >> $GITHUB_OUTPUT
echo "cluster_name=$CLUSTER_NAME"  >> $GITHUB_OUTPUT
