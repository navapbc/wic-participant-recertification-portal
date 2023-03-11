# Data attributes
data "aws_vpc" "default" {
  default = true
}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# References to current users
resource "aws_iam_group" "team" {
  name = "wic-prp-eng"
}

resource "aws_iam_group_policy" "wic-prp-eng" {
  name   = "wic-prp-eng-policy"
  group  = aws_iam_group.team.name
  policy = data.aws_iam_policy_document.wic-prp-eng.json
}

# IAM Perms to create application-level infra

data "aws_iam_policy_document" "wic-prp-eng" {
  statement {
    sid    = "General"
    effect = "Allow"
    actions = [
      "sts:GetCallerIdentity",
      "ec2:DescribeAccountAttributes",
      "ec2:DescribeVpcs",
      "ec2:DescribeSubnets",
      "ssm:DescribeParameters",
      "ec2:DescribeRouteTables",
      "elasticloadbalancing:DescribeTargetGroups",
      "ec2:DescribeSecurityGroups",
      "elasticloadbalancing:DescribeTargetGroupAttributes",
      "ecs:DescribeTaskDefinition",
      "ecs:DeregisterTaskDefinition",
      "ec2:DescribeNetworkInterfaces",
      "rds:AddTagsToResource",
      "iam:PassRole",
      "ecs:CreateCluster",
      "ecs:RegisterTaskDefinition",
      "elasticloadbalancing:DescribeLoadBalancers",
      "elasticloadbalancing:DescribeLoadBalancerAttributes",
      "elasticloadbalancing:DescribeListeners",
      "elasticloadbalancing:DescribeRules"
    ]
    resources = [
      "*"
    ]
  }
  statement {
    sid    = "Backup"
    effect = "Allow"
    actions = [
      "backup:DescribeBackupVault",
      "backup:CreateBackupVault",
      "backup:CreateBackupPlan",
      "backup:GetBackupPlan",
      "backup:CreateBackupSelection",
      "backup:GetBackupSelection"
    ]
    resources = [
      "arn:aws:backup:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:backup-vault:*",
      "arn:aws:backup:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:backup-plan:*"
    ]
  }
  statement {
    sid    = "Dynamodb"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:PutItem"
    ]
    resources = [
      "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/*"
    ]
  }
  statement {
    sid    = "EC2"
    effect = "Allow"
    actions = [
      "ec2:DescribeVpcAttribute",
      "ec2:CreateSecurityGroup",
      "ec2:RevokeSecurityGroupEgress",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupEgress"
    ]
    resources = [
      "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:vpc/*",
      "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*",
      "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group-rule/*"
    ]
  }
  statement {
    sid    = "ECS"
    effect = "Allow"
    actions = [
      "ecs:DescribeClusters",
      "ecs:CreateService",
      "ecs:DescribeServices",
      "ecs:UpdateService"
    ]
    resources = [
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/*",
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/*"
    ]
  }
  statement {
    sid    = "ELB"
    effect = "Allow"
    actions = [
      "elasticloadbalancing:CreateTargetGroup",
      "elasticloadbalancing:ModifyTargetGroupAttributes",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:SetSecurityGroups",
      "elasticloadbalancing:CreateListener",
      "elasticloadbalancing:CreateRule"
    ]
    resources = [
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*",
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*",
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:listener/*"
    ]
  }
  statement {
    sid    = "IAM"
    effect = "Allow"
    actions = [
      "iam:GetRole",
      "iam:ListRolePolicies",
      "iam:DetachRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:ListInstanceProfilesForRole",
      "iam:DeleteRole",
      "iam:CreateRole",
      "iam:AttachRolePolicy",
      "iam:PutRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:PassRole"
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*"
    ]
  }
  statement {
    sid    = "IAMPolicy"
    effect = "Allow"
    actions = [
      "iam:CreatePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion"
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/*"
    ]
  }
  statement {
    sid    = "KMS"
    effect = "Allow"
    actions = [
      "kms:DescribeKey"
    ]
    resources = [
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
    ]
  }
  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
      "logs:ListTagsLogGroup",
      "logs:CreateLogGroup",
      "logs:PutRetentionPolicy"
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group/*"
    ]
  }
  statement {
    sid    = "RDS"
    effect = "Allow"
    actions = [
      "rds:DescribeDBClusterParameterGroups",
      "rds:DescribeDBClusterParameters",
      "rds:CreateDBClusterParameterGroup",
      "rds:ModifyDBClusterParameterGroup",
      "rds:DescribeDBClusters",
      "rds:DescribeGlobalClusters",
    ]
    resources = [
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg/*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:global-cluster:*"
    ]
  }
  statement {
    sid    = "RDSCreate"
    effect = "Allow"
    actions = [
      "rds:CreateDBCluster",
      "rds:CreateDBInstance",
      "rds:DescribeDBInstances",
      "rds:ListTagsForResource"
    ]
    resources = [
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg/*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:og:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:subgrp:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:db:*"
    ]
  }
  statement {
    sid    = "S3"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::*"
    ]
  }
  statement {
    sid    = "SSM"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:DeleteParameter",
      "ssm:PutParameter"
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter//metadata/db/*"
    ]
  }
  statement {
    sid    = "SSMListTags"
    effect = "Allow"
    actions = [
      "ssm:ListTagsForResource"
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:maintenancewindow//metadata/db/*",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:opsitem//metadata/db/*",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:opsmetadata//metadata/db/*"
    ]
  }

  ######
  # Uncomment to allow this user group to delete resources
  ######
  statement {
    sid    = "BackupDelete"
    effect = "Allow"
    actions = [
      "backup:DeleteBackupVault"
    ]
    resources = [
      "arn:aws:backup:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:backup-vault:*"
    ]
  }
  statement {
    sid    = "EC2Delete"
    effect = "Allow"
    actions = [
      "ec2:DeleteSecurityGroup"
    ]
    resources = [
      "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
    ]
  }
  statement {
    sid    = "ECSDelete"
    effect = "Allow"
    actions = [
      "ecs:DeleteCluster"
    ]
    resources = [
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/*"
    ]
  }
  statement {
    sid    = "ELBDelete"
    effect = "Allow"
    actions = [
      "elasticloadbalancing:DeleteTargetGroup"
    ]
    resources = [
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*"
    ]
  }
  statement {
    sid    = "IAMDelete"
    effect = "Allow"
    actions = [
      "iam:DeleteRolePolicy",
      "iam:DeleteRole"
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*"
    ]
  }
  statement {
    sid    = "LogsDelete"
    effect = "Allow"
    actions = [
      "logs:DeleteLogGroup"
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group/*"
    ]
  }
  statement {
    sid    = "RDSDelete"
    effect = "Allow"
    actions = [
      "rds:DeleteDBCluster",
      "rds:DeleteDBClusterParameterGroup"
    ]
    resources = [
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg/*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-snapshot:*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:*"
    ]
  }
}
