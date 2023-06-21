############################################################################################
## A module for creating a machine IAM user
## - Creates a group for the machine user to belong to
## - Creates access keys for the machine user
## - Saves the machine user's access keys to Systems Manager Parameter Store
############################################################################################

############################################################################################
## IAM user and group
############################################################################################

resource "aws_iam_user" "machine_user" {
  name = var.machine_user_name
}

resource "aws_iam_group" "machine_user" {
  name = "${var.machine_user_name}-group"
}

resource "aws_iam_group_membership" "machine_user" {
  name  = "${var.machine_user_name}-group-membership"
  users = [aws_iam_user.machine_user.name]
  group = aws_iam_group.machine_user.name
}

############################################################################################
## Access key
############################################################################################

resource "aws_iam_access_key" "machine_user" {
  user = aws_iam_user.machine_user.name
}

resource "aws_ssm_parameter" "access_key_id" {
  # checkov:skip=CKV_AWS_337:Skip creating separate IAM roles for KMS keys
  name  = "${var.machine_user_name}-access-key-id"
  type  = "SecureString"
  value = aws_iam_access_key.machine_user.id
}

resource "aws_ssm_parameter" "secret_access_key" {
  # checkov:skip=CKV_AWS_337:Skip creating separate IAM roles for KMS keys
  name  = "${var.machine_user_name}-secret-access-key"
  type  = "SecureString"
  value = aws_iam_access_key.machine_user.secret
}

