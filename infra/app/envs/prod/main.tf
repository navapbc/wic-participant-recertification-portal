data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  # The prefix key/value pair is used for terraform workspaces, which is useful for projects with multiple infrastructure developers. 
  # Leave this as a static string if you are not using workspaces for this environment (recommended). Change it to terraform.workspace 
  # if you want to use workspaces in this environment.
  prefix = "prod"
  # Choose the region where this infrastructure should be deployed.
  region = "us-west-1"
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = "prod"
    description = "Application resources created in production environment"
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
    bucket         = "wic-prp-636249768232-us-west-1-tf-state"
    key            = "infra/wic-prp/environments/prod.tfstate"
    dynamodb_table = "wic-prp-tf-state-locks"
    region         = "us-west-1"
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
  source = "../../../project-config"
}

# Add application modules below
