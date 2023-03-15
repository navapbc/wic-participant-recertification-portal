data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Set up GitHub's OpenID Connect provider in AWS account
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [local.oidc_thumbprint_github]
}

# Create IAM role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name               = var.github_actions_role_name
  description        = "Service role required for Github Action to deploy application resources into the account."
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

# Attach access policies to GitHub Actions role
resource "aws_iam_role_policy_attachment" "custom" {
  count = length(var.iam_role_policy_arns)

  role       = aws_iam_role.github_actions.name
  policy_arn = var.iam_role_policy_arns[count.index]
}

# Create a policy to push images to ECR and update ECS task definitions
resource "aws_iam_policy" "deploy" {
  name        = "${var.github_actions_role_name}-deploy"
  description = "A policy for a machine user to deploy releases"
  policy      = data.aws_iam_policy_document.deploy.json
}

resource "aws_iam_role_policy_attachment" "deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.deploy.arn
}

data "aws_iam_policy_document" "deploy" {
  # Required to push a new docker image to ECR
  statement {
    sid    = "AccessECR"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }
  statement {
    sid    = "PublishImage"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "dynamodb:GetItem",
    ]
    resources = [
      "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/*",
      "arn:aws:s3:::*",
    ]
  }
  # Required to register a new ECS task definition and deploy it
  statement {
    sid    = "RegisterTaskDefinition"
    effect = "Allow"
    actions = [
      "ecs:RegisterTaskDefinition",
    ]
    resources = ["*"]
  }
  statement {
    sid    = "PassRolesInTaskDefinition"
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*",
    ]
  }
  statement {
    sid    = "DeployService"
    effect = "Allow"
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
    ]
    resources = [
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/*"
    ]
  }
}

# Get GitHub's OIDC provider's thumbprint
# See https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc_verify-thumbprint.html

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_thumbprint_github = data.tls_certificate.github.certificates.0.sha1_fingerprint
}

# Set up assume role policy for GitHub Actions to allow GitHub actions
# running from the specified repository and branches/git refs to assume
# the role
data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:${var.github_branch}"]
    }
  }
}
