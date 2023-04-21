data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  environment_name = "dev"
  # The prefix key/value pair is used for Terraform Workspaces, which is useful for projects with multiple infrastructure developers.
  # By default, Terraform creates a workspace named “default.” If a non-default workspace is not created this prefix will equal “default”, 
  # if you choose not to use workspaces set this value to "dev" 
  prefix = terraform.workspace
  # Choose the region where this infrastructure should be deployed.
  region = "us-west-2"
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = local.environment_name
    description = "Application resources created in dev environment"
  })

  tfstate_bucket = "wic-prp-636249768232-us-west-2-tf-state"
  tfstate_key    = "infra/wic-prp/environments/dev.tfstate"
}

terraform {
  required_version = ">=1.2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">=4.20.1"
    }
  }

  # Terraform does not allow interpolation here, values must be hardcoded.

  backend "s3" {
    bucket         = "wic-prp-636249768232-us-west-2-tf-state"
    key            = "infra/wic-prp/environments/dev.tfstate"
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
  participant_doc_upload_expiration = "60"
  participant_max_upload_size_bytes = "5242880"
  participant_max_upload_filecount  = "5"
  analytics_enable_exec             = true
}
