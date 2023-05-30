# generates a secure password randomly
# the analytics tool needs mysql
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
  vpc_id      = module.constants.vpc_id # need to add this to reference the default vpc

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [""] # this needs to be the security group of the ecs services
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
  identifier                      = var.database_name
  allocated_storage               = 20
  engine                          = "postgres"
  engine_version                  = "13.7"
  instance_class                  = "db.t3.micro"
  db_name                         = local.database_name_formatted
  port                            = 5432
  enabled_cloudwatch_logs_exports = ["postgresql"]
  apply_immediately               = true
  deletion_protection             = true
  storage_encrypted               = true
  skip_final_snapshot             = true
  vpc_security_group_ids          = ["${aws_security_group.database.id}"]
  username                        = data.aws_ssm_parameter.db_username.value
  password                        = aws_ssm_parameter.random_db_password.value
}

resource "aws_ssm_parameter" "random_db_password" {
  name  = "/common/database/POSTGRES_PASSWORD"
  type  = "SecureString"
  value = local.admin_password
}
