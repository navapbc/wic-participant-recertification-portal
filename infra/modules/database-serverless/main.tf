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
  admin_password             = var.admin_password == "" ? module.random_admin_database_password.random_password : var.admin_password
}

############################
## Security Groups ##
############################

resource "aws_security_group" "database" {
  description = "Allow inbound TCP access to database port"
  name        = "${var.database_name}-database-rds"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = var.database_port
    to_port     = var.database_port
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
    description = "Allow inbound TCP access to database port"
  }

  lifecycle {
    create_before_destroy = true
  }
}

############################
## Database Configuration ##
############################
resource "aws_db_instance" "database" {
  # checkov:skip=CKV_AWS_157:Multi-AZ is mostly unessecary for a project of this size.
  identifier        = var.database_name
  allocated_storage = 20
  # "postgresql isn't a supported engine name in RDS. use postgres instead"
  engine                              = var.database_type == "mysql" ? "mysql" : "postgres"
  engine_version                      = var.database_type == "mysql" ? "8.0" : "14.6"
  instance_class                      = "db.t3.micro"
  db_name                             = local.database_name_formatted
  port                                = var.database_port
  enabled_cloudwatch_logs_exports     = [var.database_type == "mysql" ? "general" : "postgresql"]
  apply_immediately                   = true
  deletion_protection                 = true
  storage_encrypted                   = true
  skip_final_snapshot                 = true
  vpc_security_group_ids              = ["${aws_security_group.database.id}"]
  username                            = local.admin_user
  password                            = local.admin_password
  auto_minor_version_upgrade          = true
  iam_database_authentication_enabled = true
  monitoring_interval                 = 60
  monitoring_role_arn                 = aws_iam_role.rds_enhanced_monitoring.arn
  parameter_group_name                = "${var.database_name}-${var.database_type}"
  copy_tags_to_snapshot               = true
}

resource "aws_ssm_parameter" "admin_password" {
  name  = local.admin_password_secret_name
  type  = "SecureString"
  value = local.admin_password
}

resource "aws_ssm_parameter" "admin_db_url" {
  name  = local.admin_db_url_secret_name
  type  = "SecureString"
  value = "${var.database_type}://${local.admin_user}:${urlencode(local.admin_password)}@${aws_db_instance.database.endpoint}:${var.database_port}/${local.database_name_formatted}?schema=public"

  depends_on = [
    aws_db_instance.database
  ]
}

resource "aws_ssm_parameter" "admin_db_host" {
  name  = local.admin_db_host_secret_name
  type  = "SecureString"
  value = "${aws_db_instance.database.endpoint}:${var.database_port}"

  depends_on = [
    aws_db_instance.database
  ]
}

resource "aws_ssm_parameter" "admin_user" {
  name  = local.admin_user_secret_name
  type  = "SecureString"
  value = local.admin_user
}
################################################################################
# Parameters for Query Logging
################################################################################

# For psql query logging, see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_LogAccess.Concepts.PostgreSQL.html#USER_LogAccess.Concepts.PostgreSQL.Query_Logging
resource "aws_db_parameter_group" "rds_query_logging_postgresql" {
  count       = var.database_type == "postgresql" ? 1 : 0
  name        = "${var.database_name}-${var.database_type}"
  family      = "postgres14"
  description = "Default parameter group"

  parameter {
    name  = "log_statement"
    value = "ddl" # Only logs major database changes (e.g. ALTER TABLE)
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1"
  }
}

# For mysql query logging, see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_LogAccess.MySQL.LogFileSize.html
resource "aws_db_parameter_group" "rds_query_logging_mysql" {
  count       = var.database_type == "mysql" ? 1 : 0
  name        = "${var.database_name}-${var.database_type}"
  family      = "mysql8.0"
  description = "Default parameter group"

  parameter {
    name  = "general_log"
    value = "1"
  }
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
    resources = [aws_db_instance.database.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:Describe*"
    ]
    resources = [aws_db_instance.database.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:AddTagToResource"
    ]
    resources = [aws_db_instance.database.arn]
  }
}
