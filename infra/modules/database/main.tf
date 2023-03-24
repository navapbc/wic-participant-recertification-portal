data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_vpc" "default" {
  default = true
}

module "random_admin_database_password" {
  source = "../random-password"
  # Mysql password is maxed out at 41 chars
  length = var.database_type == "mysql" ? 41 : 48
}

locals {
  admin_user                 = "app_usr"
  admin_user_secret_name     = "/metadata/db/${var.database_name}-admin-user"
  admin_password_secret_name = "/metadata/db/${var.database_name}-admin-password"
  admin_db_url_secret_name   = "/metadata/db/${var.database_name}-admin-db-url"
  admin_db_host_secret_name  = "/metadata/db/${var.database_name}-admin-db-host"
  database_name_formatted    = replace("${var.database_name}", "-", "_")
  admin_password             = var.admin_password == "" ? random_admin_database_password.random_password : var.admin_password
}

################################################################################
# Parameters for Query Logging
################################################################################

# For psql query logging, see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_LogAccess.Concepts.PostgreSQL.html#USER_LogAccess.Concepts.PostgreSQL.Query_Logging
resource "aws_rds_cluster_parameter_group" "rds_query_logging_postgresql" {
  count       = var.database_type == "postgresql" ? 1 : 0
  name        = "${var.database_name}-${var.database_type}"
  family      = "aurora-postgresql14"
  description = "Default cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1"
  }
}

# For mysql query logging, see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_LogAccess.MySQL.LogFileSize.html
resource "aws_rds_cluster_parameter_group" "rds_query_logging_mysql" {
  count       = var.database_type == "mysql" ? 1 : 0
  name        = "${var.database_name}-${var.database_type}"
  family      = "aurora-mysql8.0"
  description = "Default cluster parameter group"

  parameter {
    name  = "general_log"
    value = "1"
  }
}


####################
## Security Group ##
####################
resource "aws_security_group" "database" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.database_name}-database"
  description = "Allow inbound TCP access to database port"
  vpc_id      = data.aws_vpc.default.id

  lifecycle {
    create_before_destroy = true
  }

  ingress {
    description = "Allow HTTP traffic to database port"
    protocol    = "tcp"
    from_port   = var.database_port
    to_port     = var.database_port
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }
}


############################
## Database Configuration ##
############################
resource "aws_rds_cluster" "database" {
  # checkov:skip=CKV2_AWS_27:have concerns about sensitive data in logs; want better way to get this information
  # checkov:skip=CKV2_AWS_8:TODO add backup selection plan using tags
  # checkov:skip=CKV_AWS_313: This is literally a new check; more research needed
  cluster_identifier                  = var.database_name
  engine                              = "aurora-${var.database_type}"
  engine_mode                         = "provisioned"
  engine_version                      = var.database_type == "postgresql" ? "14.6" : "8.0.mysql_aurora.3.02.0"
  database_name                       = local.database_name_formatted
  master_username                     = local.admin_user
  master_password                     = local.admin_password
  port                                = var.database_port
  storage_encrypted                   = true
  iam_database_authentication_enabled = true
  deletion_protection                 = true
  skip_final_snapshot                 = true
  vpc_security_group_ids              = [aws_security_group.database.id]
  db_cluster_parameter_group_name     = "${var.database_name}-${var.database_type}"
  # final_snapshot_identifier = "${var.database_name}-final"


  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }
}

resource "aws_rds_cluster_instance" "database_instance" {
  cluster_identifier         = aws_rds_cluster.database.id
  instance_class             = "db.serverless"
  engine                     = aws_rds_cluster.database.engine
  engine_version             = aws_rds_cluster.database.engine_version
  auto_minor_version_upgrade = true
  monitoring_role_arn        = aws_iam_role.rds_enhanced_monitoring.arn
  monitoring_interval        = 30
}

resource "aws_ssm_parameter" "admin_password" {
  name  = local.admin_password_secret_name
  type  = "SecureString"
  value = local.admin_password
}

resource "aws_ssm_parameter" "admin_db_url" {
  name  = local.admin_db_url_secret_name
  type  = "SecureString"
  value = "${var.database_type}://${local.admin_user}:${urlencode(local.admin_password)}@${aws_rds_cluster_instance.database_instance.endpoint}:${var.database_port}/${local.database_name_formatted}?schema=public"

  depends_on = [
    aws_rds_cluster_instance.database_instance
  ]
}

resource "aws_ssm_parameter" "admin_db_host" {
  name  = local.admin_db_host_secret_name
  type  = "SecureString"
  value = "${aws_rds_cluster_instance.database_instance.endpoint}:${var.database_port}"

  depends_on = [
    aws_rds_cluster_instance.database_instance
  ]
}

resource "aws_ssm_parameter" "admin_user" {
  name  = local.admin_user_secret_name
  type  = "SecureString"
  value = local.admin_user
}

################################################################################
# Backup Configuration
################################################################################

resource "aws_backup_plan" "database" {
  name = "${var.database_name}-backup-plan"

  rule {
    rule_name         = "${var.database_name}-backup-rule"
    target_vault_name = "${var.database_name}-vault"
    schedule          = "cron(0 12 ? * SUN *)"
  }
}

# KMS Key for the vault
# This key was created by AWS by default alongside the vault
data "aws_kms_key" "database" {
  key_id = "alias/aws/backup"
}
# create backup vault
resource "aws_backup_vault" "database" {
  name        = "${var.database_name}-vault"
  kms_key_arn = data.aws_kms_key.database.arn
}

# create IAM role
resource "aws_iam_role" "database_backup" {
  name               = "${var.database_name}-database-backup"
  assume_role_policy = data.aws_iam_policy_document.database_backup.json
}

resource "aws_iam_role_policy_attachment" "database_backup" {
  role       = aws_iam_role.database_backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

data "aws_iam_policy_document" "database_backup" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}
# backup selection
resource "aws_backup_selection" "database_backup" {
  iam_role_arn = aws_iam_role.database_backup.arn
  name         = "${var.database_name}-backup"
  plan_id      = aws_backup_plan.database.id

  resources = [
    aws_rds_cluster.database.arn
  ]
}

################################################################################
# IAM role for enhanced monitoring
################################################################################

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name               = "${var.database_name}-rds-enhanced-monitoring"
  assume_role_policy = data.aws_iam_policy_document.rds_enhanced_monitoring.json
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

data "aws_iam_policy_document" "rds_enhanced_monitoring" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}


################################################################################
# IAM role for user access
################################################################################
resource "aws_iam_policy" "db_access" {
  name        = "${var.database_name}-db-access"
  description = "Allows administration of the database instance"
  policy      = data.aws_iam_policy_document.db_access.json
}

data "aws_iam_policy_document" "db_access" {
  statement {
    effect = "Allow"
    actions = [
      "rds:CreateDBInstance",
      "rds:ModifyDBInstance",
      "rds:CreateDBSnapshot"
    ]
    resources = [aws_rds_cluster.database.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:Describe*"
    ]
    resources = [aws_rds_cluster.database.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:AddTagToResource"
    ]
    resources = [aws_rds_cluster_instance.database_instance.arn]
  }
}
