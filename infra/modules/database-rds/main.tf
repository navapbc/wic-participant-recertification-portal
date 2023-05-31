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
  description = "allows connections to the database"
  name        = "${var.database_name}-sg"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = var.database_port
    to_port         = var.database_port
    protocol        = "tcp"
    security_groups = [data.aws_vpc.default.cidr_block]
    description     = "Allow inbound TCP access to database port"
  }
  egress {
    description      = "allow all outbound traffic"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
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
  identifier                          = var.database_name
  allocated_storage                   = 20
  engine                              = "postgresql"
  engine_version                      = "13.7"
  instance_class                      = "db.t3.micro"
  db_name                             = local.database_name_formatted
  port                                = 5432
  enabled_cloudwatch_logs_exports     = ["postgresql"]
  apply_immediately                   = true
  deletion_protection                 = true
  storage_encrypted                   = true
  skip_final_snapshot                 = true
  vpc_security_group_ids              = ["${aws_security_group.database.id}"]
  username                            = local.admin_user
  password                            = aws_ssm_parameter.random_db_password.value
  auto_minor_version_upgrade          = true
  iam_database_authentication_enabled = true
  monitoring_interval                 = 60
  parameter_group_name                = aws_rds_cluster_parameter_group.rds_query_logging_postgresql.name
  copy_tags_to_snapshot               = true
}

resource "aws_ssm_parameter" "random_db_password" {
  name  = "/common/database/POSTGRES_PASSWORD"
  type  = "SecureString"
  value = local.admin_password
}

################################################################################
# Parameters for Query Logging
################################################################################

# For psql query logging, see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_LogAccess.Concepts.PostgreSQL.html#USER_LogAccess.Concepts.PostgreSQL.Query_Logging
resource "aws_rds_cluster_parameter_group" "rds_query_logging_postgresql" {
  count       = var.database_type == "postgresql" ? 1 : 0
  name        = "${var.database_name}-${var.database_type}"
  family      = "postgresql14"
  description = "Default cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "ddl" # Only logs major database changes (e.g. ALTER TABLE)
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1"
  }
}
