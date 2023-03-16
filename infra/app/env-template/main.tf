# TODO(https://github.com/navapbc/template-infra/issues/152) use non-default VPC
data "aws_vpc" "default" {
  default = true
}

# TODO(https://github.com/navapbc/template-infra/issues/152) use private subnets
data "aws_subnets" "default" {
  filter {
    name   = "default-for-az"
    values = [true]
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  project_name             = module.project_config.project_name
  app_name                 = module.app_config.app_name
  database_name            = "${local.project_name}-${local.app_name}-${var.environment_name}"
  cluster_name             = "${local.project_name}-${local.app_name}-${var.environment_name}"
  participant_service_name = "${local.project_name}-participant-${var.environment_name}"
  staff_service_name       = "${local.project_name}-staff-${var.environment_name}"
  analytics_service_name   = "${local.project_name}-analytics-${var.environment_name}"
}

module "project_config" {
  source = "../../project-config"
}

data "aws_ecr_repository" "participant_image_repository" {
  name = "${local.project_name}-participant"
}

data "aws_ecr_repository" "staff_image_repository" {
  name = "${local.project_name}-staff"
}

data "aws_ecr_repository" "analytics_image_repository" {
  name = "${local.project_name}-analytics"
}

module "app_config" {
  source = "../app-config"
}

module "database_password" {
  source = "../../modules/random-password"
}

module "database" {
  source         = "../../modules/database"
  database_name  = local.database_name
  admin_password = module.database_password.random_password
}

module "service_cluster" {
  source       = "../../modules/service-cluster"
  cluster_name = local.cluster_name
}

module "participant" {
  source               = "../../modules/service"
  service_name         = local.participant_service_name
  image_repository_url = data.aws_ecr_repository.participant_image_repository.repository_url
  image_repository_arn = data.aws_ecr_repository.participant_image_repository.arn
  image_tag            = var.image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  service_cluster_arn  = module.service_cluster.service_cluster_arn
  container_secrets = [
    {
      name      = "DATABASE_URL",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${module.database.admin_db_url_secret_name}"
    },
    {
      name      = "POSTGRES_PASSWORD",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${module.database.admin_password_secret_name}"
    },
    {
      name      = "POSTGRES_USER",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${module.database.admin_user_secret_name}"
    }
  ]
  container_env_vars = [
    {
      name  = "NEXT_PUBLIC_DEMO_MODE",
      value = false
    }
  ]
  service_ssm_resource_paths = [
    module.database.admin_db_url_secret_name,
    module.database.admin_password_secret_name,
  ]
}

module "staff" {
  source               = "../../modules/service"
  service_name         = local.staff_service_name
  image_repository_url = data.aws_ecr_repository.staff_image_repository.repository_url
  image_repository_arn = data.aws_ecr_repository.staff_image_repository.arn
  image_tag            = var.image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  service_cluster_arn  = module.service_cluster.service_cluster_arn
}

module "analytics" {
  source               = "../../modules/service"
  service_name         = local.analytics_service_name
  image_repository_url = data.aws_ecr_repository.analytics_image_repository.repository_url
  image_repository_arn = data.aws_ecr_repository.analytics_image_repository.arn
  image_tag            = var.image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  service_cluster_arn  = module.service_cluster.service_cluster_arn
}
