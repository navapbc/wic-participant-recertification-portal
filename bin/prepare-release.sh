#!/bin/bash
set -euo pipefail

PROJECT_NAME=$1
APP_NAME=$2
ENV_NAME=$3
IMAGE_TAG=$4
INFRA_APP_NAME=$5

# Need to init module when running in CD since GitHub actions does a fresh checkout of repo
terraform -chdir=infra/$INFRA_APP_NAME/build-repository init
IMAGE_REPOSITORY_URL=$(terraform -chdir=infra/$INFRA_APP_NAME/build-repository output -raw "${APP_NAME}_image_repository_url")

terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME init
SERVICE_NAME=$(terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME output -raw "{$APP_NAME}_service_name")
CLUSTER_NAME=$(terraform -chdir=infra/$INFRA_APP_NAME/envs/$ENV_NAME output -raw cluster_name)

# Set env vars to output the arguments that are needed for:
# - aws-actions/amazon-ecs-render-task-definition
# - aws-actions/amazon-ecs-deploy-task-definition
echo "ECS_TASK_DEFINITION=infra/$INFRA_APP_NAME/modules/service/container-definitions.json.tftpl"
echo "CONTAINER_NAME=$SERVICE_NAME"
echo "IMAGE=$IMAGE_REPOSITORY_URL:$IMAGE_TAG"
echo "SERVICE_NAME=$SERVICE_NAME"
echo "CLUSTER_NAME=$CLUSTER_NAME"
