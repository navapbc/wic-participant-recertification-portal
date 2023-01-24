# Data attributes
data "aws_vpc" "default" {
  default = true
}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# References to current users
data "aws_iam_group" "team" {
  group_name = "wic-prp-eng"
}

# IAM Perms to create application-level infra
resource "aws_iam_role" "wic-prp-eng" {
  name               = "wic-prp-eng"
  assume_role_policy = data.aws_iam_policy_document.wic-prp-eng.json
}

resource "aws_iam_role_policy" "wic-prp-eng" {
  name   = "wic-prp-eng-policy"
  role   = aws_iam_role.wic-prp-eng.arn
  policy = data.aws_iam_policy_document.wic-prp-eng.json
}

data "aws_iam_policy_document" "wic-prp-eng-assume-role" {
  statement {
    sid     = "WICUsersAssumeRole"
    actions = ["sts:AssumeRole", ]
    principals {
      type = "AWS"
      identifiers = [
        "*"
      ]
    }
  }
}

data "aws_iam_policy_document" "wic-prp-eng" {
  statement {
    sid    = "GenAcctAccess"
    effect = "Allow"
    actions = [
      "cloudtrail:AddTags",
      "cloudtrail:DescribeTrails",
      "cloudtrail:ListTags",
      "cloudtrail:ListTrails",
      "cloudtrail:LookupEvents",
      "ec2:DescribeAccountAttributes",
      "ec2:DescribeRouteTables",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "ecr:DescribeRepositories",
      "ecs:ListClusters",
      "ecs:ListServices",
      "iam:GetAccountPasswordPolicy",
      "iam:GetAccountSummary",
      "iam:GetServiceLastAccessedDetails",
      "iam:ListAccountAliases",
      "iam:ListGroups",
      "iam:ListMFADevices",
      "iam:ListOpenIDConnectProviders",
      "iam:ListPolicies",
      "iam:ListRoles",
      "iam:ListSAMLProviders",
      "iam:ListUsers",
      "kms:CreateKey",
      "kms:ListAliases",
      "s3:GetAccountPublicAccessBlock",
      "s3:ListAccessPoints",
      "s3:ListAllMyBuckets",
      "securityhub:DescribeHub",
      "sts:GetCallerIdentity"
    ]
    resources = ["*"]
  }
  statement {
    sid       = "EC2Actions"
    effect    = "Allow"
    actions   = ["ec2:DescribeVpcAttribute", ]
    resources = [data.aws_vpc.default.arn]
  }
  statement {
    sid       = "ECRActions"
    effect    = "Allow"
    actions   = ["ecr:ListTagsForResource"]
    resources = ["arn:aws:ecr:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:repository/*"]
  }
  statement {
    sid       = "ECSClusters"
    effect    = "Allow"
    actions   = ["ecs:DescribeClusters"]
    resources = ["arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/*"]
  }
  statement {
    sid       = "ECSServices"
    effect    = "Allow"
    actions   = ["ecs:DescribeServices"]
    resources = ["arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${ClusterName}/${ServiceName}"]
  }
  statement {
    sid    = "IAMServices"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:CreateServiceLinkedRole",
      "iam:GenerateServiceLastAccessedDetails",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:GetServiceLinkedRoleDeletionStatus",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:PutRolePolicy"
    ]
    resources = [aws_iam_role.wic-prp-eng.arn]
  }
  statement {
    sid       = "KMSServices"
    effect    = "Allow"
    actions   = ["kms:CreateAlias"]
    resources = ["arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alias/*"]
  }
  statement {
    sid    = "KMSServices"
    effect = "Allow"
    actions = [
      "kms:CreateAlias",
      "kms:Decrypt",
      "kms:PutKeyPolicy",
      "kms:TagResource"
    ]
    resources = ["arn:aws:kms:*:${data.aws_caller_identity.current.account_id}:key/*"]
  }
  statement {
    sid    = "S3SServices"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:GetBucketAcl",
      "s3:GetBucketLocation",
      "s3:GetBucketPolicyStatus",
      "s3:GetBucketPublicAccessBlock",
      "s3:PutBucketPolicy",
      "s3:PutBucketPublicAccessBlock"
    ]
    resources = ["*"]
  }
}
