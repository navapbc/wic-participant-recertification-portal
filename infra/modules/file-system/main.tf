############################################################################################
## A module for creating an Elastic File System
## - Creates an EFS with an access point and a mount target
## - Creates a backup policy for AWS Backup
## - Creates a security group to allow all traffic within the VPC
##
## Note: Managing EFS in terraform can produce noisy `terraform plan` and `terraform apply`
## warnings regarding the aws_efs_file_system.size_in_bytes attribute causing drift.
## These warnings can mostly be safely ignored as long as the actual `terraform apply` does not
## change the resource in some undesirable way.
## This is a known issue, but does not appear to have a current recommended resolution.
## See https://github.com/hashicorp/terraform-provider-aws/issues/19728
##
## For example:
## > Note: Objects have changed outside of Terraform
## > Terraform detected the following changes made outside of Terraform since the last "terraform apply" which may have affected this plan:
## >   # module.app.module.analytics.module.fs["html"].aws_efs_file_system.fs has changed
## >   ~ resource "aws_efs_file_system" "fs" {
## >         id                              = "fs-0cc2f852a77320f12"
## >       ~ size_in_bytes                   = [
## >           ~ {
## >               ~ value             = 132726784 -> 204404736
## >               ~ value_in_standard = 132726784 -> 204404736
## >                 # (1 unchanged element hidden)
## >             },
## >         ]
## >         tags                            = {}
## >         # (11 unchanged attributes hidden)
## >     }
## > Unless you have made equivalent changes to your configuration, or ignored the relevant attributes using ignore_changes, the following plan may include actions to undo or respond to these changes.
############################################################################################

############################################################################################
# EFS configuration
############################################################################################

resource "aws_efs_file_system" "fs" {
  # checkov:skip=CKV_AWS_184:@TODO use a customer managed kms key for encryption
  # checkov:skip=CKV2_AWS_18:@TODO set up backup plan
  encrypted      = true
  creation_token = var.resource_name
}

resource "aws_efs_access_point" "fs" {
  file_system_id = aws_efs_file_system.fs.id
  posix_user {
    uid = var.access_point_posix_uid
    gid = var.access_point_posix_gid
  }
  root_directory {
    path = var.access_point_root_dir
    creation_info {
      owner_uid   = var.access_point_posix_uid
      owner_gid   = var.access_point_posix_gid
      permissions = var.access_point_posix_permissions
    }
  }
}

resource "aws_efs_mount_target" "fs" {
  for_each        = toset(var.subnet_ids)
  file_system_id  = aws_efs_file_system.fs.id
  subnet_id       = each.value
  security_groups = [aws_security_group.fs.id]
}

resource "aws_efs_backup_policy" "fs" {
  file_system_id = aws_efs_file_system.fs.id
  backup_policy {
    status = "ENABLED"
  }
}

############################################################################################
# Network configuration
############################################################################################

resource "aws_security_group" "fs" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.resource_name}-sg"
  description = "Allow EFS inbound traffic from VPC"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true

    # changing the description is a destructive change
    # just ignore it
    ignore_changes = [description]
  }

  ingress {
    description = "NFS traffic from VPC"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = var.cidr_blocks
  }
}
