data "aws_caller_identity" "current" {}
data "aws_region" "current" {}


###########################
## Database Configuration ##
###########################
resource "aws_rds_cluster" "postgresql" {
  # checkov:skip=CKV2_AWS_27:have concerns about sensitive data in logs; want better way to get this information
  # checkov:skip=CKV2_AWS_8:TODO add backup selection plan using tags
  cluster_identifier                  = var.database_name
  engine                              = "aurora-postgresql"
  engine_mode                         = "provisioned"
  database_name                       = replace("${var.database_name}", "-", "_")
  master_username                     = "app_usr"
  master_password                     = var.admin_password
  storage_encrypted                   = true
  iam_database_authentication_enabled = true
  deletion_protection                 = false
  skip_final_snapshot                 = true
  # final_snapshot_identifier = "${var.database_name}-final"


  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }
}

resource "aws_rds_cluster_instance" "postgresql-cluster" {
  cluster_identifier         = aws_rds_cluster.postgresql.id
  instance_class             = "db.serverless"
  engine                     = aws_rds_cluster.postgresql.engine
  engine_version             = aws_rds_cluster.postgresql.engine_version
  auto_minor_version_upgrade = true
  monitoring_role_arn        = aws_iam_role.rds_enhanced_monitoring.arn
  monitoring_interval        = 30
}

resource "aws_ssm_parameter" "admin_password" {
  name  = "/metadata/db/${var.database_name}-admin-password"
  type  = "SecureString"
  value = var.admin_password
}


################################################################################
# Backup Configuration
################################################################################

resource "aws_backup_plan" "postgresql" {
  name = "${var.database_name}-backup-plan"

  rule {
    rule_name         = "${var.database_name}-backup-rule"
    target_vault_name = "${var.database_name}-vault"
    schedule          = "cron(0 12 ? * SUN *)"
  }
}

# KMS Key for the vault
# This key was created by AWS by default alongside the vault
data "aws_kms_key" "postgresql" {
  key_id = "alias/aws/backup"
}
# create backup vault
resource "aws_backup_vault" "postgresql" {
  name        = "${var.database_name}-vault"
  kms_key_arn = data.aws_kms_key.postgresql.arn
}

# create IAM role
resource "aws_iam_role" "postgresql_backup" {
  name               = "${var.database_name}-postgresql-backup"
  assume_role_policy = data.aws_iam_policy_document.postgresql_backup.json
}

resource "aws_iam_role_policy_attachment" "postgresql_backup" {
  role       = aws_iam_role.postgresql_backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

data "aws_iam_policy_document" "postgresql_backup" {
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
resource "aws_backup_selection" "postgresql_backup" {
  iam_role_arn = aws_iam_role.postgresql_backup.arn
  name         = "${var.database_name}-backup"
  plan_id      = aws_backup_plan.postgresql.id

  resources = [
    aws_rds_cluster.postgresql.arn
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
# Parameters for Query Logging
################################################################################

resource "aws_rds_cluster_parameter_group" "rds_query_logging" {
  name        = var.database_name
  family      = "aurora-postgresql13"
  description = "Default cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "all" # ddl for template; none for wic
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1"
  }
}

################################################################################
# IAM role for user access
################################################################################
resource "aws_iam_policy" "db_access" {
  name        = "${var.database_name}-db-access"
  description = "Allows access to the database instance"
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
    resources = [aws_rds_cluster.postgresql.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:Describe*"
    ]
    resources = [aws_rds_cluster.postgresql.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:AddTagToResource"
    ]
    resources = [aws_rds_cluster_instance.postgresql-cluster.arn]
  }
}
