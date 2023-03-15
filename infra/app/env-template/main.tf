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

locals {
  project_name  = module.project_config.project_name
  app_name      = module.app_config.app_name
  database_name = "${local.project_name}-${local.app_name}-${var.environment_name}"
  cluster_name  = local.database_name
}

module "project_config" {
  source = "../../project-config"
}

data "aws_ecr_repository" "participant_image_repository" {
  name = "${local.project_name}-participant"
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

module "participant_portal" {
  source                = "../../modules/service"
  service_name          = "${local.project_name}-participant-${var.environment_name}"
  image_repository_url = data.participant_image_repository.repository_url
  image_repository_arn = data.participant_image_repository.arn
  image_tag             = var.image_tag
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
  service_cluster_arn   = module.service_cluster.service_cluster_arn
}

module "staff_portal" {
  source                = "../../modules/service"
  service_name          = "${local.project_name}-staff-${var.environment_name}"
  image_repository_url = data.participant_image_repository.repository_url
  image_repository_arn = data.participant_image_repository.arn
  image_tag             = var.image_tag
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
  service_cluster_arn   = module.service_cluster.service_cluster_arn
}

module "analytics" {
  source                = "../../modules/service"
  service_name          = "${local.project_name}-analytics-${var.environment_name}"
  image_repository_url = data.participant_image_repository.repository_url
  image_repository_arn = data.participant_image_repository.arn
  image_tag             = var.image_tag
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
  service_cluster_arn   = module.service_cluster.service_cluster_arn
}
