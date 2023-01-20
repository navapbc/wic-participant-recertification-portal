# IAM Perms to create application-level infra
resource "aws_iam_role" "wic-prp-eng" {
  name = "wic-prp-eng"
  assume_role_policy = data.aws_iam_policy_document.wic-prp-eng.json
}

resource "aws_iam_role_policy" "wic-prp-eng" {
  name = "wic-prp-eng-policy"
  role = aws_iam_role.wic-prp-eng.arn
  policy = data.aws_iam_policy_document.wic-prp-eng.json
}

data "aws_iam_policy_document" "wic-prp-eng" {
  statement {
    sid     = "WICUsersAssumeRole"
    actions = ["sts:AssumeRole",]
    principals {
      type = "AWS"
      identifiers = [
        "" # arn for the iam users here
      ]
    }
  }
}

data "aws_iam_policy_document" "wic-prp-eng"{
    statement {
      sid = "GenAcctAccess"
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
      sid = "EC2Actions"
      effect = "Allow"
      actions = ["ec2:DescribeVpcAttribute",]
      resources = [ "arn:aws:ec2:${Region}:${Account}:vpc/${VpcId}" ] #todo: fill this in
    }
    statement {
      sid = "ECRActions"
      effect = "Allow"
      actions = [ "ecr:ListTagsForResource" ]
      resources = [ "arn:aws:ecr:${Region}:${Account}:repository/${RepositoryName}" ]
    }
    statement {
      sid = "ECSClusters"
      effect = "Allow"
      actions = [ "ecs:DescribeClusters" ]
      resources = [ "arn:aws:ecs:${Region}:${Account}:cluster/${ClusterName}" ]
    }
    statement {
      sid = "ECSServices"
      effect = "Allow"
      actions = [ "ecs:DescribeServices" ]
      resources = [ "arn:aws:ecs:${Region}:${Account}:service/${ClusterName}/${ServiceName}" ]
    }
    statement {
      sid = "IAMServices"
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
      resources = [ "arn:aws:iam::${Account}:role/${RoleNameWithPath}" ]
    }
    statement {
      sid = "KMSServices"
      effect = "Allow"
      actions = ["kms:CreateAlias" ]
      resources = [ "arn:aws:kms:${Region}:${Account}:alias/${Alias}" ]
    }
    statement {
      sid = "KMSServices"
      effect = "Allow"
      actions = [
        "kms:CreateAlias",
        "kms:Decrypt",
        "kms:PutKeyPolicy",
        "kms:TagResource"
       ]
      resources = [ "arn:aws:kms:${Region}:${Account}:key/${KeyId}" ]
    }
    statement {
      sid = "S3SServices"
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
      resources = [ "*" ]
    }
}

# Misc Perms to be added to the infra role
/* 
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": "cloudformation:DescribeStacks",
			"Resource": "arn:aws:cloudformation:${Region}:${Account}:stack/${StackName}/${Id}"
		},
		{
			"Effect": "Allow",
			"Action": [
				"cloudtrail:CreateTrail",
				"cloudtrail:GetEventSelectors",
				"cloudtrail:GetInsightSelectors",
				"cloudtrail:GetTrail",
				"cloudtrail:GetTrailStatus",
				"cloudtrail:PutEventSelectors",
				"cloudtrail:PutInsightSelectors",
				"cloudtrail:StartLogging"
			],
			"Resource": "arn:aws:cloudtrail:${Region}:${Account}:trail/${TrailName}"
		},
		{
			"Effect": "Allow",
			"Action": "iam:GenerateServiceLastAccessedDetails",
			"Resource": "arn:aws:iam::${Account}:group/${GroupNameWithPath}"
		},
		{
			"Effect": "Allow",
			"Action": [
				"iam:CreatePolicy",
				"iam:GenerateServiceLastAccessedDetails"
			],
			"Resource": "arn:aws:iam::${Account}:policy/${PolicyNameWithPath}"
		},
	]
*/