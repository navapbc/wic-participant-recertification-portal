data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  environment_name = "staging"
  # The prefix key/value pair is used for terraform workspaces, which is useful for projects with multiple infrastructure developers. 
  # Leave this as a static string if you are not using workspaces for this environment (recommended). Change it to terraform.workspace 
  # if you want to use workspaces in this environment.
  prefix = "staging"
  # Choose the region where this infrastructure should be deployed.
  region = "us-west-2"
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = "staging"
    description = "Application resources created in staging environment"
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
    key            = "infra/wic-prp/environments/staging.tfstate"
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
  source = "../../../project-config"
}

# Add application modules below
module "app" {
  source           = "../../env-template"
  environment_name = local.environment_name

  # Image tags
  participant_image_tag = var.participant_image_tag
  staff_image_tag       = var.staff_image_tag
  analytics_image_tag   = var.analytics_image_tag

  # Urls
  participant_url = "${local.environment_name}.wic-services.org"
  staff_url       = "${local.environment_name}-staff.wic-services.org"
  analytics_url   = "${local.environment_name}-analytics.wic-services.org"

  # Misc settings
  analytics_enable_exec = true
}
