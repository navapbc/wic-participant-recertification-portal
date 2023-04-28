# @TODO: triggers, vpc

data "aws_vpc" "default" {
  default = true
}

data "aws_ecr_repository" "image_repository" {
  name = var.image_repository_name
}

locals {
  image_uri             = "${data.aws_ecr_repository.image_repository.repository_url}:${var.image_tag}"
  execution_role_name   = "${var.function_name}-execution"
  execution_policy_name = "${var.function_name}-execution-role-policy"
  log_group_name        = "lambda/${var.function_name}"
  api_gateway_name = "${var.function_name}-api-gateway"
}

################################################################################
# Lambda
################################################################################

resource "aws_lambda_function" "serverless" {
  function_name = var.function_name
  description   = "A lambda to deploy an image container"
  role          = aws_iam_role.execution.arn

  # Using container image support.
  # See https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/
  image_uri    = local.image_uri
  package_type = "Image"
  timeout = 6
  memory_size = 1024

  # VPC config.
  # vpc_config {
  #   security_group_ids = [aws_security_group.serverless.id]
  #   subnet_ids         = data.aws_vpc.default.id
  # }
}

################################################################################
# Security group
################################################################################

# resource "aws_security_group" "serverless" {
#   # Specify name_prefix instead of name because when a change requires creating a new
#   # security group, sometimes the change requires the new security group to be created
#   # before the old one is destroyed. In this situation, the new one needs a unique name
#   name_prefix = "${var.function_name}-serverless"
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

resource "aws_cloudwatch_log_group" "serverless" {
  name = local.log_group_name

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

################################################################################
# IAM for access to Cloudwatch logs
################################################################################

resource "aws_iam_role" "execution" {
  name               = local.execution_role_name
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
  name        = local.execution_policy_name
  description = "A policy for Lambda execution"
  policy      = data.aws_iam_policy_document.execution.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution.arn
}

data "aws_iam_policy_document" "execution" {
  statement {
    sid    = "AccessLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:TagResource",
    ]
    resources = ["${aws_cloudwatch_log_group.serverless.arn}:*"]
  }

  statement {
    sid    = "CreateLogEvents"
    actions = [
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.serverless.arn}:*:*"]
  }
}

################################################################################
# API Gateway
################################################################################

# resource "aws_api_gateway_rest_api" "ag" {
#   name        = local.api_gateway_name
#   description = "An API gateway for running a container lambda"
# }

# resource "aws_api_gateway_resource" "ag" {
#   rest_api_id = aws_api_gateway_rest_api.ag.id
#   parent_id   = aws_api_gateway_rest_api.ag.root_resource_id
#   path_part   = "mydemoresource" #??
# }

# resource "aws_api_gateway_method" "ag" {
#   rest_api_id   = aws_api_gateway_rest_api.ag.id
#   resource_id   = aws_api_gateway_resource.ag.id
#   http_method   = "GET"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_integration" "ag" {
#   rest_api_id          = aws_api_gateway_rest_api.ag.id
#   resource_id          = aws_api_gateway_resource.ag.id
#   http_method          = aws_api_gateway_method.ag.http_method
#   type                 = "MOCK"
#   cache_key_parameters = ["method.request.path.param"]
#   cache_namespace      = "foobar"
#   timeout_milliseconds = 30000

#   request_parameters = {
#     "integration.request.header.X-Authorization" = "'static'"
#   }

#   # Transforms the incoming XML request to JSON
#   request_templates = {
#     "application/xml" = <<EOF
# {
#    "body" : $input.json('$')
# }
# EOF
#   }
# }