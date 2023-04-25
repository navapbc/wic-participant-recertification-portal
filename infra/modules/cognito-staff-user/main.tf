locals {
  environment_name = var.environment_name
  # The prefix key/value pair is used for Terraform Workspaces, which is useful for projects with multiple infrastructure developers.
  # By default, Terraform creates a workspace named “default.” If a non-default workspace is not created this prefix will equal “default”,
  # if you choose not to use workspaces set this value to "dev"
  prefix = terraform.workspace
  # Choose the region where this infrastructure should be deployed.
  region = "us-west-2"
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = local.environment_name
    description = "Cognito user resources created in ${var.environment_name} environment"
  })
}

terraform {
  required_version = ">=1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">=4.59.0"
    }
  }

  # Terraform does not allow interpolation here, values must be hardcoded.

  backend "s3" {
    bucket         = "wic-prp-636249768232-us-west-2-tf-state"
    key            = "infra/wic-prp/cognito-staff-user.tfstate"
    dynamodb_table = "wic-prp-tf-state-locks"
    region         = "us-west-2"
    encrypt        = "true"
    workspace_key_prefix  = "workspace"
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

data "aws_cognito_user_pools" "pool" {
  name = var.user_pool_name
}

resource "aws_cognito_user" "user" {
  for_each     = var.user_emails
  username     = each.key
  user_pool_id = tolist(data.aws_cognito_user_pools.pool.ids)[0]

  desired_delivery_mediums = ["EMAIL"]
  enabled                  = true

  attributes = {
    email          = each.key
    email_verified = true
  }
}
