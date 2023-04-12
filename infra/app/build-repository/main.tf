data "aws_iam_role" "github_actions" {
  name = module.project_config.github_actions_role_name
}

locals {
  project_name = module.project_config.project_name
  app_name     = "wic-prp"
  region       = "us-west-2"

  # Set project tags that will be used to tag all resources.
  tags = merge(module.project_config.default_tags, {
    application      = local.app_name
    application_role = "build-repository"
    description      = "Backend resources required for storing built release candidate artifacts to be used for deploying to environments."
  })
}

terraform {
  required_version = ">=1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>4.20.1"
    }
  }

  # Terraform does not allow interpolation here, values must be hardcoded.

  backend "s3" {
    bucket         = "wic-prp-636249768232-us-west-2-tf-state"
    key            = "infra/wic-prp/build-repository.tfstate"
    dynamodb_table = "wic-prp-tf-state-locks"
    region         = "us-west-2"
    encrypt        = "true"
  }
}

provider "aws" {
  region = local.region
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../../project-config"
}

module "app_config" {
  source = "../app-config"
}

module "participant_image_repository" {
  source               = "../../modules/container-image-repository"
  name                 = "${local.project_name}-participant"
  push_access_role_arn = data.aws_iam_role.github_actions.arn
  app_account_ids      = var.app_environment_account_ids
}

module "staff_image_repository" {
  source               = "../../modules/container-image-repository"
  name                 = "${local.project_name}-staff"
  push_access_role_arn = data.aws_iam_role.github_actions.arn
  app_account_ids      = var.app_environment_account_ids
}

module "analytics_image_repository" {
  source               = "../../modules/container-image-repository"
  name                 = "${local.project_name}-analytics"
  push_access_role_arn = data.aws_iam_role.github_actions.arn
  app_account_ids      = var.app_environment_account_ids
}

module "test20230411_image_repository" {
  source               = "../../modules/container-image-repository"
  name                 = "${local.project_name}-test20230411"
  push_access_role_arn = data.aws_iam_role.github_actions.arn
  app_account_ids      = var.app_environment_account_ids
}
