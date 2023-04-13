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
  project_name              = module.project_config.project_name
  app_name                  = module.app_config.app_name
  cluster_name              = "${local.project_name}-${local.app_name}-${var.environment_name}"
  participant_database_name = "${local.project_name}-participant-${var.environment_name}"
  participant_service_name  = "${local.project_name}-participant-${var.environment_name}"
  staff_service_name        = "${local.project_name}-staff-${var.environment_name}"
  analytics_service_name    = "${local.project_name}-analytics-${var.environment_name}"
  analytics_database_name   = "${local.project_name}-analytics-${var.environment_name}"
  document_upload_s3_name   = "${local.project_name}-doc-upload-${var.environment_name}"
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

module "participant_database" {
  source        = "../../modules/database"
  database_name = local.participant_database_name
}

module "service_cluster" {
  source       = "../../modules/service-cluster"
  cluster_name = local.cluster_name
}

# referencing the record that already exists in the console
data "aws_route53_zone" "participant_url"{
  name = "wic-services.org"
}

data "aws_lb" "alb"{
  name = local.participant_service_name
}
# creating subdomains for each env (except prod)
resource "aws_route53_zone" "participant_url_envs" {
  name = "${var.environment_name}.wic-services.org"
}

# for subdomains a NS record is required
resource "aws_route53_record" "subdomain_ns_record" {
  name = "${var.environment_name}.wic-services.org"
  zone_id = data.aws_route53_zone.participant_url.id
  type = "NS"
  ttl =30
  records = data.aws_route53_zone.participant_url.name_servers
}
# ALIAS record for subdomains
resource "aws_route53_record" "subdomain_alias_record" {
  name = "${var.environment_name}.wic-services.org"
  type = "A"
  zone_id = data.aws_route53_zone.participant_url.id
  alias {
    name = data.aws_lb.alb.dns_name # <- this is the service name in the module. make it participant service name
    zone_id = data.aws_route53_zone.participant_url.id
    evaluate_target_health = true
  }
}

module "participant" {
  source               = "../../modules/service"
  service_name         = local.participant_service_name
  image_repository_url = data.aws_ecr_repository.participant_image_repository.repository_url
  image_repository_arn = data.aws_ecr_repository.participant_image_repository.arn
  image_tag            = var.participant_image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  service_cluster_arn  = module.service_cluster.service_cluster_arn
  container_port       = 3000
  healthcheck_path     = "/healthcheck"
  enable_exec          = var.participant_enable_exec
  container_secrets = [
    {
      name      = "DATABASE_URL",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.participant_database.admin_db_url_secret_name}"
    },
    {
      name      = "POSTGRES_PASSWORD",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.participant_database.admin_password_secret_name}"
    },
    {
      name      = "POSTGRES_USER",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.participant_database.admin_user_secret_name}"
    }
  ]
  container_env_vars = [
    {
      name  = "PUBLIC_DEMO_MODE",
      value = false
    }
  ]
  service_ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_name,
    module.participant_database.admin_password_secret_name,
    module.participant_database.admin_user_secret_name,
  ]
  container_bind_mounts = {
    "tmp" : {
      volume_name    = "${local.participant_service_name}-tmp",
      container_path = "/tmp",
    }
  }

  depends_on = [
    module.participant_database,
  ]
}

module "staff" {
  source               = "../../modules/service"
  service_name         = local.staff_service_name
  image_repository_url = data.aws_ecr_repository.staff_image_repository.repository_url
  image_repository_arn = data.aws_ecr_repository.staff_image_repository.arn
  image_tag            = var.staff_image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  service_cluster_arn  = module.service_cluster.service_cluster_arn
  container_port       = 3000
  enable_exec          = var.staff_enable_exec
  container_secrets = [
    {
      name      = "LOWDEFY_SECRET_PG_CONNECTION_STRING",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.participant_database.admin_db_url_secret_name}"
    },
  ]
  service_ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_name,
  ]

  depends_on = [
    module.participant_database,
  ]
}

module "analytics_database" {
  source        = "../../modules/database"
  database_name = local.analytics_database_name
  database_port = 3306
  database_type = "mysql"
}

module "analytics_file_system" {
  source                 = "../../modules/file-system"
  resource_name          = "${local.analytics_service_name}-fs"
  vpc_id                 = data.aws_vpc.default.id
  subnet_ids             = data.aws_subnets.default.ids
  cidr_blocks            = [data.aws_vpc.default.cidr_block]
  access_point_posix_uid = 33
  access_point_posix_gid = 33
  access_point_root_dir  = "/fargate"
}

module "analytics" {
  source                   = "../../modules/service"
  service_name             = local.analytics_service_name
  image_repository_url     = data.aws_ecr_repository.analytics_image_repository.repository_url
  image_repository_arn     = data.aws_ecr_repository.analytics_image_repository.arn
  image_tag                = var.analytics_image_tag
  vpc_id                   = data.aws_vpc.default.id
  subnet_ids               = data.aws_subnets.default.ids
  service_cluster_arn      = module.service_cluster.service_cluster_arn
  container_port           = 8080
  container_read_only      = false # Matomo/apache needs to be able to write to the rootfs
  healthcheck_path         = "/matomo.php"
  healthcheck_start_period = 300 # Matomo needs a really long startup time grace period
  enable_exec              = var.analytics_enable_exec
  container_secrets = [
    {
      name      = "MATOMO_DATABASE_HOST",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.analytics_database.admin_db_host_secret_name}"
    },
    {
      name      = "MATOMO_DATABASE_PASSWORD",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.analytics_database.admin_password_secret_name}"
    },
    {
      name      = "MATOMO_DATABASE_USERNAME",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.analytics_database.admin_user_secret_name}"
    }
  ]
  container_env_vars = [
    {
      name  = "MATOMO_DATABASE_DBNAME",
      value = local.analytics_database_name
    }
  ]
  service_ssm_resource_paths = [
    module.analytics_database.admin_db_host_secret_name,
    module.analytics_database.admin_password_secret_name,
    module.analytics_database.admin_user_secret_name,
  ]
  container_efs_volumes = {
    "html" : {
      volume_name      = "${local.analytics_service_name}-html",
      container_path   = "/var/www/html",
      file_system_id   = module.analytics_file_system.file_system.id,
      file_system_arn  = module.analytics_file_system.file_system.arn,
      access_point_id  = module.analytics_file_system.access_point.id,
      access_point_arn = module.analytics_file_system.access_point.arn,
    }
  }

  depends_on = [
    module.analytics_database,
    module.analytics_file_system,
  ]
}

module "doc_upload" {
  source            = "../../modules/s3-encrypted"
  environment_name  = var.environment_name
  s3_bucket_name    = local.document_upload_s3_name
  read_role_names   = [module.participant.task_executor_role_name, module.staff.task_executor_role_name]
  write_role_names  = [module.participant.task_executor_role_name]
  delete_role_names = []
}
