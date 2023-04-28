# @TODO: triggers, vpc

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_vpc" "default" {
  default = true
}

data "aws_ecr_repository" "image_repository" {
  name = var.image_repository_name
}

locals {
  image_uri                           = "${data.aws_ecr_repository.image_repository.repository_url}:${var.image_tag}"
  lambda_execution_role_name          = "${var.function_name}-execution"
  lambda_execution_policy_name        = "${var.function_name}-execution-role-policy"
  lambda_log_group_name               = "lambda/${var.function_name}"
  api_gateway_name                    = "${var.function_name}-api-gateway"
  api_gateway_log_group_name          = "api-gateway/access-logs/${var.function_name}"
  api_gateway_stage_name              = "main"
  api_gateway_region_wide_role_name   = "api-gateway-cloudwatch-logs"
  api_gateway_region_wide_policy_name = "api-gateway-cloudwatch-logs-invocation-role-policy"
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
  timeout      = 6
  memory_size  = 1024

  # VPC config.
  # vpc_config {
  #   security_group_ids = [aws_security_group.lambda_container.id]
  #   subnet_ids         = data.aws_vpc.default.id
  # }
}

resource "aws_lambda_permission" "lambda_container" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_container.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${aws_api_gateway_rest_api.proxy.execution_arn}/*/*"
}

################################################################################
# Security group
################################################################################

# resource "aws_security_group" "lambda_container" {
#   # Specify name_prefix instead of name because when a change requires creating a new
#   # security group, sometimes the change requires the new security group to be created
#   # before the old one is destroyed. In this situation, the new one needs a unique name
#   name_prefix = "${var.function_name}-lambda_container"
#   description = "Allow inbound TCP access to application container port"
#   lifecycle {
#     create_before_destroy = true
#   }

#   ingress {
#     description = "Allow HTTP traffic to application container port"
#     protocol    = "tcp"
#     from_port   = var.container_port
#     to_port     = var.container_port
#     cidr_blocks = [data.aws_vpc.default.cidr_block]
#   }

#   egress {
#     description = "Allow all outgoing traffic from application"
#     protocol    = "-1"
#     from_port   = 0
#     to_port     = 0
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# }

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
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution.arn
}

################################################################################
# API Gateway
################################################################################

resource "aws_api_gateway_rest_api" "proxy" {
  name        = local.api_gateway_name
  description = "An API gateway for running a container lambda"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.proxy.id
  parent_id   = aws_api_gateway_rest_api.proxy.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.proxy.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy" {
  rest_api_id             = aws_api_gateway_rest_api.proxy.id
  resource_id             = aws_api_gateway_method.proxy.resource_id
  http_method             = aws_api_gateway_method.proxy.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda_container.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.proxy.id
  resource_id   = aws_api_gateway_rest_api.proxy.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_root" {
  rest_api_id             = aws_api_gateway_rest_api.proxy.id
  resource_id             = aws_api_gateway_method.proxy_root.resource_id
  http_method             = aws_api_gateway_method.proxy_root.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda_container.invoke_arn
}

resource "aws_api_gateway_deployment" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.proxy.id
  stage_name  = local.api_gateway_stage_name
  description = "The only stage for this API gateway"

  depends_on = [
    aws_api_gateway_integration.proxy,
    aws_api_gateway_integration.proxy_root,
  ]
}

resource "aws_api_gateway_stage" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.proxy.id
  stage_name    = local.api_gateway_stage_name
  deployment_id = aws_api_gateway_deployment.proxy.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.proxy.arn
    format = jsonencode(
      {
        requestId         = "$context.requestId"
        extendedRequestId = "$context.extendedRequestId"
        ip                = "$context.identity.sourceIp"
        caller            = "$context.identity.caller"
        user              = "$context.identity.user"
        requestTime       = "$context.requestTime"
        httpMethod        = "$context.httpMethod"
        resourcePath      = "$context.resourcePath"
        status            = "$context.status"
        protocol          = "$context.protocol"
        responseLength    = "$context.responseLength"
      }
    )
  }

  depends_on = [
    aws_cloudwatch_log_group.proxy
  ]
}

resource "aws_api_gateway_method_settings" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.proxy.id
  stage_name  = aws_api_gateway_stage.proxy.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }

  depends_on = [
    aws_api_gateway_account.region
  ]
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
