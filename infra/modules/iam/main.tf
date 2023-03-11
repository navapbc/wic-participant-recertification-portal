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
      "s3:GetAccountPublicAccessBlock",
      "s3:ListAccessPoints",
      "s3:ListAllMyBuckets",
      "sts:GetCallerIdentity"
    ]
    resources = ["*"]
  }
  statement {
    sid       = "EC2Actions"
    effect    = "Allow"
    actions   = ["ec2:DescribeVpcAttribute"]
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
    resources = ["arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/*/*"]
  }
  statement {
    sid    = "IAMServices"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:CreateServiceLinkedRole",
      "iam:GenerateServiceLastAccessedDetails",
      "iam:GetAccountPasswordPolicy",
      "iam:GetLoginProfile",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:GetServiceLinkedRoleDeletionStatus",
      "iam:GetUser",
      "iam:ListAccessKeys",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListUserPolicies",
      "iam:PutRolePolicy"
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"]
  }
  statement {
    sid    = "KMSServices"
    effect = "Allow"
    actions = [
      "kms:CreateAlias",
      "kms:DescribeKey",
      "kms:Decrypt",
      "kms:PutKeyPolicy",
      "kms:TagResource",
      "kms:CreateKey",
      "kms:ListAliases"
    ]
    resources = [
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alias/*",
      "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
    ]
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
    resources = ["arn:aws:s3:::*"]
  }
}
