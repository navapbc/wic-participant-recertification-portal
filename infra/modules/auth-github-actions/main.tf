############################################################################################
## This module sets up a way for GitHub Actions to access AWS resources using short-lived
## credentials without requiring long-lived access keys and without requiring separate AWS
## identities that ## need to be managed. It does that by doing the following:
##
## 1. Set up GitHub as an OpenID Connect Provider in the AWS account
## 2. Create an IAM role that GitHub actions will assume
## 3. Attach an IAM policy to the GitHub actions role that provides the necessary access
##    to AWS account resources
##
## Similar functionality is also implemented in the [oidc-github module in the Terraform Registry](https://registry.terraform.io/modules/unfunco/oidc-github/aws/latest)
## (see also [Nava's fork of ## that repo](https://github.com/navapbc/terraform-aws-oidc-github)),
## but since IAM is sensitive we chose to implement it ourselves to keep the module simple,
## easy to understand, and in a place that's within our scope of control.
##
## * [AWS - Creating OpenID Connect (OIDC) Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
## * [GitHub - Security Hardening with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
############################################################################################

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
  # Allow github actions to access the terraform state in order to run `terraform init`
  statement {
    sid    = "AccessTFState"
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
  # Required to download the ECS task definition
  statement {
    sid    = "DescribeECSTaskDefinition"
    effect = "Allow"
    actions = [
      "ecs:DescribeTaskDefinition",
    ]
    resources = ["*"]
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
