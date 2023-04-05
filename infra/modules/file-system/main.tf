# Note that managing EFS in terraform can produce noisy `terraform plan` and `terraform apply`
# warnings regarding the aws_efs_file_system.size_in_bytes attribute causing drift.
# These warnings can mostly be safely ignored as long as the actual `terraform apply` does not
# change the resource in some undesirable way.
# This is a known issue, but does not appear to have a current recommended resolution.
# See https://github.com/hashicorp/terraform-provider-aws/issues/19728
#
# For example:
# > Note: Objects have changed outside of Terraform
# > Terraform detected the following changes made outside of Terraform since the last "terraform apply" which may have affected this plan:
# >   # module.app.module.analytics.module.fs["html"].aws_efs_file_system.fs has changed
# >   ~ resource "aws_efs_file_system" "fs" {
# >         id                              = "fs-0cc2f852a77320f12"
# >       ~ size_in_bytes                   = [
# >           ~ {
# >               ~ value             = 132726784 -> 204404736
# >               ~ value_in_standard = 132726784 -> 204404736
# >                 # (1 unchanged element hidden)
# >             },
# >         ]
# >         tags                            = {}
# >         # (11 unchanged attributes hidden)
# >     }
# > Unless you have made equivalent changes to your configuration, or ignored the relevant attributes using ignore_changes, the following plan may include actions to undo or respond to these changes.

################################################################################
# Backup Configuration
################################################################################

# resource "aws_backup_plan" "database" {
#   name = "${var.database_name}-backup-plan"

#   rule {
#     rule_name         = "${var.database_name}-backup-rule"
#     target_vault_name = "${var.database_name}-vault"
#     schedule          = "cron(0 12 ? * SUN *)"
#   }
# }

# KMS Key for the vault
# This key was created by AWS by default alongside the vault
data "aws_kms_key" "fs" {
  key_id = "alias/aws/backup"
}
# create backup vault
# resource "aws_backup_vault" "database" {
#   name        = "${var.database_name}-vault"
#   kms_key_arn = data.aws_kms_key.database.arn
# }

# # create IAM role
# resource "aws_iam_role" "database_backup" {
#   name               = "${var.database_name}-database-backup"
#   assume_role_policy = data.aws_iam_policy_document.database_backup.json
# }

# resource "aws_iam_role_policy_attachment" "database_backup" {
#   role       = aws_iam_role.database_backup.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
# }

# data "aws_iam_policy_document" "database_backup" {
#   statement {
#     actions = [
#       "sts:AssumeRole",
#     ]

#     effect = "Allow"

#     principals {
#       type        = "Service"
#       identifiers = ["backup.amazonaws.com"]
#     }
#   }
# }
# # backup selection
# resource "aws_backup_selection" "database_backup" {
#   iam_role_arn = aws_iam_role.database_backup.arn
#   name         = "${var.database_name}-backup"
#   plan_id      = aws_backup_plan.database.id

#   resources = [
#     aws_rds_cluster.database.arn
#   ]
# }

################################################################################
# EFS configuration
################################################################################

resource "aws_efs_file_system" "fs" {
  encrypted = true
  # kms_key_id = ...
}

resource "aws_efs_access_point" "fs" {
  file_system_id = aws_efs_file_system.fs.id
}

resource "aws_efs_mount_target" "fs" {
  for_each        = toset(var.subnet_ids)
  file_system_id  = aws_efs_file_system.fs.id
  subnet_id       = each.value
  security_groups = var.security_groups
}

resource "aws_efs_backup_policy" "fs" {
  file_system_id = aws_efs_file_system.fs.id
  backup_policy {
    status = "ENABLED"
  }
}
