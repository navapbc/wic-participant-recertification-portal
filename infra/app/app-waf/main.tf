locals {
  project_name = module.project_config.project_name
  app_name     = "wic-prp"
  region       = "us-west-2"
  waf_name     = "${local.project_name}-${local.app_name}-waf"

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
      version = ">=4.20.1"
    }
  }

  # Terraform does not allow interpolation here, values must be hardcoded.

  backend "s3" {
    bucket         = "wic-prp-636249768232-us-west-2-tf-state"
    key            = "infra/wic-prp/app-waf.tfstate"
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


module "waf" {
  source   = "../../modules/waf"
  waf_name = local.waf_name
}
