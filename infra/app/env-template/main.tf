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
  project_name                 = module.project_config.project_name
  app_name                     = module.app_config.app_name
  cluster_name                 = "${local.project_name}-${local.app_name}-${var.environment_name}"
  participant_database_name    = "${local.project_name}-participant-${var.environment_name}"
  participant_service_name     = "${local.project_name}-participant-${var.environment_name}"
  staff_cognito_user_pool_name = "${local.project_name}-user-pool-${var.environment_name}"
  staff_service_name           = "${local.project_name}-staff-${var.environment_name}"
  analytics_service_name       = "${local.project_name}-analytics-${var.environment_name}"
  analytics_database_name      = "${local.project_name}-analytics-${var.environment_name}"
  document_upload_s3_name      = "${local.project_name}-doc-upload-${var.environment_name}"
  contact_email                = "wic-projects-team@navapbc.com"
  staff_idp_client_domain      = "${var.environment_name}-idp.wic-services.org"
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

data "aws_ses_domain_identity" "verified_domain" {
  domain = "wic-services.org"
}

module "staff_idp" {
  source                     = "../../modules/cognito"
  pool_name                  = local.staff_cognito_user_pool_name
  password_minimum_length    = 15
  email_sending_account      = "DEVELOPER"
  from_email_address         = "WIC Montana Staff Portal <no-reply@wic-services.org>"
  reply_to_email_address     = local.contact_email
  email_source_arn           = data.aws_ses_domain_identity.verified_domain.arn
  invite_email_message       = <<EOT
Thank you for participating in Montana's WIC recertification pilot.
To activate your account, you need to enter a temporary password and reset your password.
Your username is {username} and your temporary password is {####}.
Please log into the WIC Staff Portal at ${var.staff_url} to reset your password.
Please reach out to our technical team at ${local.contact_email} at any time to resolve any issues you encounter.
EOT
  invite_email_subject       = "Please verify your WIC Staff Portal account"
  verification_email_message = <<EOT
Thank you for participating in Montana's WIC recertification pilot.
We received a request to reset your WIC Staff Portal password. To do so, you need to enter a password reset code.
The password reset code for your account is {####}. Please complete the password reset process at ${var.staff_url}.
If you didn’t request a password reset, please ignore this email. Your password won’t be changed.
Please reach out to our technical team at ${local.contact_email} at any time to resolve any issues you encounter.
EOT
  verification_email_subject = "Reset your WIC Staff Portal password"
  client_callback_urls       = ["https://${var.staff_url}/auth/openid-callback"]
  client_logout_urls         = ["https://${var.staff_url}/login"]
  client_domain              = local.staff_idp_client_domain
  hosted_zone_domain         = "wic-services.org"
}

module "staff_secret" {
  source = "../../modules/random-password"
  length = 256
}

resource "aws_ssm_parameter" "staff_jwt_secret" {
  name  = "/metadata/staff/${var.environment_name}-jwt-secret"
  type  = "SecureString"
  value = base64encode(module.staff_secret.random_password)
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
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.participant_database.admin_db_url_secret_name}",
    },
    {
      name      = "LOWDEFY_SECRET_OPENID_CLIENT_ID",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.staff_idp.client_id_secret_name}",
    },
    {
      name      = "LOWDEFY_SECRET_OPENID_CLIENT_SECRET",
      valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${module.staff_idp.client_secret_secret_name}",
    },
    {
      name      = "LOWDEFY_SECRET_JWT_SECRET",
      valueFrom = aws_ssm_parameter.staff_jwt_secret.arn,
    },
  ]
  container_env_vars = [
    {
      name  = "LOWDEFY_SECRET_OPENID_DOMAIN",
      value = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${module.staff_idp.user_pool_id}/.well-known/openid-configuration",
    },
  ]
  service_ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_name,
    module.staff_idp.client_id_secret_name,
    module.staff_idp.client_secret_secret_name,
    aws_ssm_parameter.staff_jwt_secret.name,
  ]
  depends_on = [
    module.participant_database,
    module.staff_idp,
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

# todo: cleanup service names
module "dns" {
  source                   = "../../modules/dns-config"
  environment_name         = var.environment_name
  analytics_service_name   = local.analytics_service_name
  participant_service_name = local.participant_service_name
  staff_service_name       = local.staff_service_name
  participant_url          = var.participant_url
  staff_url                = var.staff_url
  analytics_url            = var.analytics_url
}
