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
      "ec2:Describe*",
      "ecs:CreateCluster",
      "ecs:DeregisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "elasticloadbalancing:Describe*",
      "kms:CreateKey",
      "kms:ListAliases",
      "rds:AddTagsToResource",
      "ssm:DescribeParameters",
      "sts:GetCallerIdentity",
      "ssm:ListTagsForResource",
      "backup-storage:MountCapsule",
    ]
    resources = [
      "*"
    ]
  }
  statement {
    sid    = "Backup"
    effect = "Allow"
    actions = [
      "backup:*",
    ]
    resources = [
      "arn:aws:backup:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*",
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
      "ec2:*",
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
      "ecs:CreateService",
      "ecs:DeleteCluster",
      "ecs:Describe*",
      "ecs:UpdateService",
      "ecs:DeleteService",
    ]
    resources = [
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/*",
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/*"
    ]
  }
  statement {
    sid    = "ECR"
    effect = "Allow"
    actions = [
      "ecr:Describe*",
      "ecr:ListTagsForResource",
    ]
    resources = [
      "arn:aws:ecr:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:repository/*",
    ]
  }
  statement {
    sid    = "ELB"
    effect = "Allow"
    actions = [
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:CreateListener",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateRule",
      "elasticloadbalancing:CreateTargetGroup",
      "elasticloadbalancing:DeleteRule",
      "elasticloadbalancing:DeleteListener",
      "elasticloadbalancing:DeleteLoadBalancer",
      "elasticloadbalancing:DeleteTargetGroup",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:ModifyTargetGroupAttributes",
      "elasticloadbalancing:SetSecurityGroups",
    ]
    resources = [
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*",
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*",
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:listener/*",
      "arn:aws:elasticloadbalancing:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:listener-rule/*",
    ]
  }
  statement {
    sid    = "IAM"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:ListRolePolicies",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:TagRole",
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
      "iam:DeletePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicyVersions",
      "iam:TagPolicy",
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/*"
    ]
  }
  statement {
    sid    = "KMS"
    effect = "Allow"
    actions = [
      "kms:DescribeKey",
      "kms:CreateAlias",
      "kms:Decrypt",
    ]
    resources = [
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*",
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alias/*",
    ]
  }
  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DescribeLogGroups",
      "logs:ListTagsLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*",
    ]
  }
  statement {
    sid    = "RDS"
    effect = "Allow"
    actions = [
      "rds:CreateDBClusterParameterGroup",
      "rds:DeleteDBCluster",
      "rds:DeleteDBClusterParameterGroup",
      "rds:Describe*",
      "rds:ModifyDBClusterParameterGroup",
    ]
    resources = [
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg/*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg:*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-snapshot:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:global-cluster:*"
    ]
  }
  statement {
    sid    = "RDSCreate"
    effect = "Allow"
    actions = [
      "rds:CreateDBCluster",
      "rds:CreateDBInstance",
      "rds:DeleteDBInstance",
      "rds:DescribeDBInstances",
      "rds:ListTagsForResource",
    ]
    resources = [
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster-pg/*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster:*",
      "arn:aws:rds:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:db:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:og:*",
      "arn:aws:rds::${data.aws_caller_identity.current.account_id}:subgrp:*",
    ]
  }
  statement {
    sid    = "S3"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::*"
    ]
  }
  statement {
    sid    = "SSM"
    effect = "Allow"
    actions = [
      "ssm:AddTagsToResource",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:DeleteParameter",
      "ssm:PutParameter",
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/metadata/db/*"
    ]
  }
}
