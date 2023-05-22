############################################################################################
## The root module used to manage all per-environment resources
## Note: This module assumes that the Route53 Hosted Zone has been created in the AWS Console.
##       It also assumes that SSL cert has been created in ACM in the AWS Console.
############################################################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "project_config" {
  source = "../../project-config"
}

module "app_config" {
  source = "../app-config"
}

locals {
  project_name                            = module.project_config.project_name
  app_name                                = module.app_config.app_name
  hosted_zone_domain                      = "wic-services.org"
  cluster_name                            = "${local.project_name}-${local.app_name}-${var.environment_name}"
  participant_database_name               = "${local.project_name}-participant-${var.environment_name}"
  participant_service_name                = "${local.project_name}-participant-${var.environment_name}"
  staff_cognito_user_pool_name            = "${local.project_name}-staff-${var.environment_name}"
  staff_service_name                      = "${local.project_name}-staff-${var.environment_name}"
  analytics_service_name                  = "${local.project_name}-analytics-${var.environment_name}"
  analytics_database_name                 = "${local.project_name}-analytics-${var.environment_name}"
  document_upload_s3_name                 = "${local.project_name}-doc-upload-${var.environment_name}"
  refresh_s3_presigned_urls_schedule_name = "${local.project_name}-s3-refresh-schedule-${var.environment_name}"
  side_load_s3_name                       = "${local.project_name}-side-load-${var.environment_name}"
  contact_email                           = "wic-projects-team@navapbc.com"
  staff_idp_client_domain                 = "${var.environment_name}-idp.wic-services.org"
  waf_name                                = "${local.project_name}-${local.project_name}-waf"
}

data "aws_acm_certificate" "ssl_cert" {
  domain = local.hosted_zone_domain
}

############################################################################################
## VPC
## - Currently uses the default VPC
############################################################################################

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

############################################################################################
## Document upload
## - Creates an IAM user to pass to the AWS SDK in the participant app for S3 operations
## - Creates an S3 bucket
## - Sets CORS policy for the document upload S3 bucket
############################################################################################

module "s3_machine_user" {
  # checkov:skip=CKV_AWS_273:Explicitly using an IAM user for longer S3 presigned url expiration times

  source            = "../../modules/iam-machine-user"
  machine_user_name = local.document_upload_s3_name
}

module "doc_upload" {
  source             = "../../modules/s3-encrypted"
  s3_bucket_name     = local.document_upload_s3_name
  log_target_prefix  = var.environment_name
  read_group_names   = [module.s3_machine_user.machine_user_group_name]
  write_group_names  = [module.s3_machine_user.machine_user_group_name]
  delete_group_names = [module.s3_machine_user.machine_user_group_name]
}

resource "aws_s3_bucket_cors_configuration" "doc_upload_cors" {
  bucket = local.document_upload_s3_name

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["https://${var.participant_url}"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

############################################################################################
## ECS service cluster
## - Contains services for the participant, staff, and analytics applications
############################################################################################

module "service_cluster" {
  source       = "../../modules/service-cluster"
  cluster_name = local.cluster_name
}

############################################################################################
## The participant application
## - Creates an RDS Aurora postgresql database
## - Creates an A record for the application
## - Creates an ECS service and task for the Remix application
## - Sets autoscaling for the ECS service
## - Creates an Eventbridge schedule to update S3 presigned urls saved to the database
##   so that they don't expire and become inaccessible
## - Creates an S3 bucket to side load data, such as staff users, into the database
############################################################################################

data "aws_ecr_repository" "participant_image_repository" {
  name = "${local.project_name}-participant"
}

module "participant_database" {
  source        = "../../modules/database"
  database_name = local.participant_database_name
  vpc_id        = data.aws_vpc.default.id
  cidr_blocks   = [data.aws_vpc.default.cidr_block]
}

module "participant_dns" {
  source               = "../../modules/dns-alias"
  hosted_zone_domain   = local.hosted_zone_domain
  application_alb_name = local.participant_service_name
  alias_url            = var.participant_url
}

module "participant" {
  source                             = "../../modules/service"
  service_name                       = local.participant_service_name
  image_repository_url               = data.aws_ecr_repository.participant_image_repository.repository_url
  image_repository_arn               = data.aws_ecr_repository.participant_image_repository.arn
  waf_name                           = local.waf_name
  image_tag                          = var.participant_image_tag
  vpc_id                             = data.aws_vpc.default.id
  subnet_ids                         = data.aws_subnets.default.ids
  ssl_cert_arn                       = data.aws_acm_certificate.ssl_cert.arn
  service_cluster_arn                = module.service_cluster.service_cluster_arn
  container_port                     = 3000
  memory                             = 2048
  healthcheck_path                   = "/healthcheck"
  service_deployment_maximum_percent = 250
  task_role_max_session_duration     = 12 * 60 * 60 # 12 hours
  # The database seed needs longer lead time before healthchecks kick in to kill the container
  healthcheck_start_period = 120
  enable_exec              = var.participant_enable_exec
  container_secrets = [
    {
      name      = "DATABASE_URL",
      valueFrom = module.participant_database.admin_db_url_secret_arn,
    },
    {
      name      = "POSTGRES_PASSWORD",
      valueFrom = module.participant_database.admin_password_secret_arn,
    },
    {
      name      = "POSTGRES_USER",
      valueFrom = module.participant_database.admin_user_secret_arn,
    },
    {
      name      = "AWS_ACCESS_KEY_ID",
      valueFrom = module.s3_machine_user.access_key_id_secret_arn,
    },
    {
      name      = "AWS_SECRET_ACCESS_KEY",
      valueFrom = module.s3_machine_user.secret_access_key_secret_arn,
    },
  ]
  container_env_vars = [
    {
      name  = "S3_PRESIGNED_URL_EXPIRATION",
      value = var.participant_s3_presigned_url_expiration,
    },
    {
      name  = "S3_PRESIGNED_URL_RENEWAL_THRESHOLD",
      value = var.participant_s3_presigned_url_renewal_threshold,
    },
    {
      name  = "MAX_UPLOAD_SIZE_BYTES",
      value = var.participant_max_upload_size_bytes,
    },
    {
      name  = "MAX_UPLOAD_FILECOUNT",
      value = var.participant_max_upload_filecount,
    },
    {
      name  = "MAX_SESSION_SECONDS",
      value = var.participant_max_session_seconds,
    },
    {
      name  = "AWS_REGION",
      value = data.aws_region.current.name,
    },
    {
      name  = "S3_BUCKET",
      value = local.document_upload_s3_name,
    },
    {
      name  = "PUBLIC_DEMO_MODE",
      value = false,
    },
    {
      name  = "MATOMO_URL_BASE",
      value = var.analytics_url,
    },
    {
      name  = "MATOMO_SECURE",
      value = true,
    },
    {
      name  = "LOG_LEVEL",
      value = var.participant_log_level,
    }
  ]
  ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_arn,
    module.participant_database.admin_password_secret_arn,
    module.participant_database.admin_user_secret_arn,
    module.s3_machine_user.access_key_id_secret_arn,
    module.s3_machine_user.secret_access_key_secret_arn,
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

module "participant_autoscale" {
  source                      = "../../modules/service-autoscaling"
  ecs_cluster_name            = local.cluster_name
  ecs_service_name            = local.participant_service_name
  ecs_task_executor_role_name = "${local.participant_service_name}-task-executor"
}

module "refresh_s3_presigned_urls" {
  source                  = "../../modules/task-scheduled"
  schedule_name           = local.refresh_s3_presigned_urls_schedule_name
  cluster_name            = local.cluster_name
  task_definition_family  = local.participant_service_name
  container_task_override = "{\"containerOverrides\": [{\"name\": \"${local.participant_service_name}\", \"command\": [\"npm\", \"run\", \"refresh-s3-urls\"]}]}"
  security_group_ids      = [module.participant.app_security_group_id]
  subnet_ids              = data.aws_subnets.default.ids
  schedule_expression     = "cron(0 9 * * ? *)" # Run once a day at ~3am US time
  schedule_enabled        = true
}

module "side_load" {
  source            = "../../modules/s3-encrypted"
  s3_bucket_name    = local.side_load_s3_name
  log_target_prefix = var.environment_name
  read_group_names  = [module.s3_machine_user.machine_user_group_name]
}

############################################################################################
## The staff application
## - Creates a Cognito user pool and client
## - Creates a JWT secret required by the staff application
## - Creates an A record for the application
## - Creates an ECS service and task for the Lowdefy application
############################################################################################

data "aws_ecr_repository" "staff_image_repository" {
  name = "${local.project_name}-staff"
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
  invite_email_message       = "Thank you for participating in Montana's WIC recertification pilot. Your username is {username} and {####} is your temporary password. To activate your account, log into the WIC Staff Portal at https://${var.staff_url}, enter your temporary password, and follow the prompts to reset your password. Please reach out to our technical team at ${local.contact_email} at any time to resolve any issues you encounter."
  invite_email_subject       = "Please activate your WIC Staff Portal account"
  verification_email_message = "Thank you for participating in Montana's WIC recertification pilot. We received a request to reset your WIC Staff Portal password. To complete this request, go to https://${var.staff_url} and enter this password reset code {####}. If you didn't request a password reset, please ignore this email – your password won't be changed. Please reach out to our technical team at ${local.contact_email} at any time to resolve any issues you encounter."
  verification_email_subject = "Reset your WIC Staff Portal password"
  client_callback_urls       = ["https://${var.staff_url}/auth/openid-callback"]
  client_logout_urls         = ["https://${var.staff_url}/login"]
  client_domain              = local.staff_idp_client_domain
  hosted_zone_domain         = "wic-services.org"
  waf_name                   = local.waf_name
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

module "staff_dns" {
  source               = "../../modules/dns-alias"
  hosted_zone_domain   = local.hosted_zone_domain
  application_alb_name = local.staff_service_name
  alias_url            = var.staff_url
}

module "staff" {
  source               = "../../modules/service"
  service_name         = local.staff_service_name
  image_repository_url = data.aws_ecr_repository.staff_image_repository.repository_url
  waf_name             = local.waf_name
  image_repository_arn = data.aws_ecr_repository.staff_image_repository.arn
  image_tag            = var.staff_image_tag
  vpc_id               = data.aws_vpc.default.id
  subnet_ids           = data.aws_subnets.default.ids
  ssl_cert_arn         = data.aws_acm_certificate.ssl_cert.arn
  service_cluster_arn  = module.service_cluster.service_cluster_arn
  container_port       = 3000
  enable_exec          = var.staff_enable_exec
  enable_healthcheck   = false
  container_secrets = [
    {
      name      = "LOWDEFY_SECRET_PG_CONNECTION_STRING",
      valueFrom = module.participant_database.admin_db_url_secret_arn,
    },
    {
      name      = "LOWDEFY_SECRET_OPENID_CLIENT_ID",
      valueFrom = module.staff_idp.client_id_secret_arn,
    },
    {
      name      = "LOWDEFY_SECRET_OPENID_CLIENT_SECRET",
      valueFrom = module.staff_idp.client_secret_secret_arn,
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
  ssm_resource_paths = [
    module.participant_database.admin_db_url_secret_arn,
    module.staff_idp.client_id_secret_arn,
    module.staff_idp.client_secret_secret_arn,
    aws_ssm_parameter.staff_jwt_secret.arn,
  ]
  depends_on = [
    module.participant_database,
    module.staff_idp,
  ]
}

############################################################################################
## The analytics application
## - Creates an RDS Aurora mysql database
## - Creates an A record for the application
## - Creates an EFS for persistent container data
## - Creates an ECS service and task for the Matomo application
############################################################################################

data "aws_ecr_repository" "analytics_image_repository" {
  name = "${local.project_name}-analytics"
}

module "analytics_database" {
  source        = "../../modules/database"
  database_name = local.analytics_database_name
  database_port = 3306
  database_type = "mysql"
  vpc_id        = data.aws_vpc.default.id
  cidr_blocks   = [data.aws_vpc.default.cidr_block]
}

module "analytics_dns" {
  source               = "../../modules/dns-alias"
  hosted_zone_domain   = local.hosted_zone_domain
  application_alb_name = local.analytics_service_name
  alias_url            = var.analytics_url
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
  waf_name                 = local.waf_name
  image_repository_arn     = data.aws_ecr_repository.analytics_image_repository.arn
  image_tag                = var.analytics_image_tag
  vpc_id                   = data.aws_vpc.default.id
  subnet_ids               = data.aws_subnets.default.ids
  ssl_cert_arn             = data.aws_acm_certificate.ssl_cert.arn
  service_cluster_arn      = module.service_cluster.service_cluster_arn
  memory                   = 2048
  container_port           = 8080
  container_read_only      = false # Matomo/apache needs to be able to write to the rootfs
  healthcheck_path         = "/matomo.php"
  healthcheck_start_period = 300 # Matomo needs a really long startup time grace period
  enable_exec              = var.analytics_enable_exec
  container_secrets = [
    {
      name      = "MATOMO_DATABASE_HOST",
      valueFrom = module.analytics_database.admin_db_host_secret_arn,
    },
    {
      name      = "MATOMO_DATABASE_PASSWORD",
      valueFrom = module.analytics_database.admin_password_secret_arn,
    },
    {
      name      = "MATOMO_DATABASE_USERNAME",
      valueFrom = module.analytics_database.admin_user_secret_arn,
    }
  ]
  container_env_vars = [
    {
      name  = "MATOMO_DATABASE_DBNAME",
      value = local.analytics_database_name,
    }
  ]
  ssm_resource_paths = [
    module.analytics_database.admin_db_host_secret_arn,
    module.analytics_database.admin_password_secret_arn,
    module.analytics_database.admin_user_secret_arn,
  ]
  container_efs_volumes = {
    "html" : {
      volume_name      = "${local.analytics_service_name}-html",
      container_path   = "/var/www/html",
      file_system_id   = module.analytics_file_system.file_system_id,
      file_system_arn  = module.analytics_file_system.file_system_arn,
      access_point_id  = module.analytics_file_system.access_point_id,
      access_point_arn = module.analytics_file_system.access_point_arn,
    }
  }
  depends_on = [
    module.analytics_database,
    module.analytics_file_system,
  ]
}
