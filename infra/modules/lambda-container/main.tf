# @TODO: triggers, vpc

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    values = [data.aws_vpc.default.id]
    name   = "vpc-id"
  }
}

data "aws_ecr_repository" "image_repository" {
  name = var.image_repository_name
}

################################################################################
# Secret Values
################################################################################

data "aws_ssm_parameter" "secrets" {
  for_each = var.container_secrets
  name     = each.value
}


################################################################################
# Locals
################################################################################

locals {
  ssm_secret_map = {
    for item in data.aws_ssm_parameter.secrets : item.name => item.value
  }
}

locals {
  image_uri                           = "${data.aws_ecr_repository.image_repository.repository_url}:${var.image_tag}"
  hosted_zone_domain                  = "wic-services.org"
  lambda_execution_role_name          = "${var.function_name}-execution"
  lambda_execution_policy_name        = "${var.function_name}-execution-role-policy"
  lambda_log_group_name               = "lambda/${var.function_name}"
  acm_certificate_arn                 = "arn:aws:acm:us-west-2:636249768232:certificate/62c0de42-7822-4ab0-90eb-6d59c188cde6"
  api_gateway_name                    = "${var.function_name}-api-gateway"
  api_gateway_log_group_name          = "api-gateway/access-logs/${var.function_name}"
  api_gateway_region_wide_role_name   = "api-gateway-cloudwatch-logs"
  api_gateway_region_wide_policy_name = "api-gateway-cloudwatch-logs-invocation-role-policy"
  staff_url                           = var.staff_url
  container_env_vars                  = merge({ for key, value in var.container_secrets : key => local.ssm_secret_map[value] }, var.container_env_vars)
}



################################################################################
# Networking
################################################################################


resource "aws_security_group" "lambda_security_group" {
  name        = "${var.function_name}-security-group"
  description = "Security group for ${var.function_name}"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_security_group_rule" "lambda_security_group_egress_rule" {
  type              = "egress"
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.lambda_security_group.id
}



################################################################################
# Lambda
################################################################################

resource "aws_lambda_function" "lambda_container" {
  function_name = var.function_name
  description   = "A lambda to deploy an image container"
  role          = aws_iam_role.execution.arn

  # Using container image support.
  # See https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/
  image_uri    = local.image_uri
  package_type = "Image"
  timeout      = 300
  memory_size  = 1024
  vpc_config {
    # Every subnet should be able to reach an EFS mount target in the same Availability Zone. Cross-AZ mounts are not permitted.
    subnet_ids         = toset(data.aws_subnets.default.ids)
    security_group_ids = [aws_security_group.lambda_security_group.id]
  }
  environment {
    variables = local.container_env_vars
  }
}

resource "aws_lambda_permission" "lambda_container" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_container.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${aws_apigatewayv2_api.gateway.execution_arn}/*/*"
}

################################################################################
# Cloudwatch logs
################################################################################

resource "aws_cloudwatch_log_group" "lambda_container" {
  name = local.lambda_log_group_name

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

resource "aws_cloudwatch_log_group" "proxy" {
  name = local.api_gateway_log_group_name

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

################################################################################
# Lambda: IAM for access to Cloudwatch logs
################################################################################

resource "aws_iam_role" "execution" {
  name               = local.lambda_execution_role_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_execution_role.json
}

data "aws_iam_policy_document" "lambda_assume_execution_role" {
  statement {
    sid = "LambdaExecution"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "execution" {
  name        = local.lambda_execution_policy_name
  description = "A policy for Lambda execution"
  policy      = data.aws_iam_policy_document.execution.json
}

data "aws_iam_policy_document" "execution" {
  statement {
    sid = "AccessLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:TagResource",
    ]
    resources = ["${aws_cloudwatch_log_group.lambda_container.arn}:*"]
  }

  statement {
    sid = "CreateLogEvents"
    actions = [
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.lambda_container.arn}:*:*"]
  }

  statement {
    sid = "ECRPullAccess"
    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [data.aws_ecr_repository.image_repository.arn]
  }

  statement {
    sid = "VPCpermissions"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateTags",
      "ec2:DeleteNetworkInterface"
    ]
    resources = ["*"]
  }

}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution.arn
}

################################################################################
# API Gateway
################################################################################

resource "aws_apigatewayv2_api" "gateway" {
  name          = local.api_gateway_name
  description   = "HTTP Gateway for Staff Lambda"
  protocol_type = "HTTP"
  target        = aws_lambda_function.lambda_container.arn
}

resource "aws_apigatewayv2_domain_name" "gateway_domain" {
  domain_name = local.staff_url
  domain_name_configuration {
    certificate_arn = local.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "default_mapping" {
  api_id      = aws_apigatewayv2_api.gateway.id
  domain_name = aws_apigatewayv2_domain_name.gateway_domain.id
  stage       = "$default"
}

data "aws_route53_zone" "application_domain" {
  name = local.hosted_zone_domain
}

resource "aws_route53_record" "api_gateway_domain_alias" {
  name    = aws_apigatewayv2_domain_name.gateway_domain.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.application_domain.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.gateway_domain.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.gateway_domain.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

################################################################################
# API Gateway: Access for Cloudwatch logs
################################################################################

resource "aws_iam_role" "region" {
  name               = local.api_gateway_region_wide_role_name
  assume_role_policy = data.aws_iam_policy_document.api_gateway_assume_execution_role.json
}

data "aws_iam_policy_document" "api_gateway_assume_execution_role" {
  statement {
    sid = "ApiGatewayAccessCloudwatchLogs"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "region" {
  name        = local.api_gateway_region_wide_policy_name
  description = "The region wide policy for API Gateway"
  policy      = data.aws_iam_policy_document.region.json
}

data "aws_iam_policy_document" "region" {
  statement {
    sid = "AccessLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*:*",
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*:*:*",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "region" {
  role       = aws_iam_role.region.name
  policy_arn = aws_iam_policy.region.arn
}

resource "aws_api_gateway_account" "region" {
  cloudwatch_role_arn = aws_iam_role.region.arn
}
