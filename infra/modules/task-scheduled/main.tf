data "aws_caller_identity" "current" {}

locals {
  schedule_role_name        = "${var.schedule_name}-role"
  schedule_role_policy_name = "${var.schedule_name}-policy"
}

##############################################
## Lookup ECS resources
##############################################

data "aws_ecs_cluster" "cluster" {
  cluster_name = var.cluster_name
}

data "aws_ecs_task_definition" "task_definition" {
  task_definition = var.task_definition_family
}

##############################################
## Eventbridge schedule
##############################################

resource "aws_scheduler_schedule" "schedule" {
  # checkov:skip=CKV_AWS_297:Encrypt Eventbridge scheduler schedule with customer key in full deployment
  name                         = var.schedule_name
  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = var.schedule_expression_timezone
  state                        = var.schedule_enabled ? "ENABLED" : "DISABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = data.aws_ecs_cluster.cluster.arn
    role_arn = aws_iam_role.schedule.arn
    input    = var.container_task_override
    ecs_parameters {
      task_definition_arn     = data.aws_ecs_task_definition.task_definition.arn_without_revision
      enable_ecs_managed_tags = true
      launch_type             = "FARGATE"
      network_configuration {
        security_groups  = var.security_group_ids
        subnets          = var.subnet_ids
        assign_public_ip = true
      }
      platform_version = "LATEST"
      propagate_tags   = "TASK_DEFINITION"
    }

    retry_policy {
      maximum_retry_attempts = 0
    }
  }

  depends_on = [
    aws_iam_role.schedule
  ]
}

##############################################
## IAM role
##############################################

resource "aws_iam_role" "schedule" {
  name               = local.schedule_role_name
  assume_role_policy = data.aws_iam_policy_document.schedule_assume_role.json
}

data "aws_iam_policy_document" "schedule_assume_role" {
  statement {
    sid = "ECSTask"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "schedule" {
  name        = local.schedule_role_policy_name
  description = "A policy for Eventbridge schedule"
  policy      = data.aws_iam_policy_document.schedule.json
}

resource "aws_iam_role_policy_attachment" "schedule" {
  role       = aws_iam_role.schedule.name
  policy_arn = aws_iam_policy.schedule.arn
}

data "aws_iam_policy_document" "schedule" {
  statement {
    sid    = "EcsRunTask"
    effect = "Allow"
    actions = [
      "ecs:RunTask"
    ]
    resources = [
      "${data.aws_ecs_task_definition.task_definition.arn_without_revision}:*",
      "${data.aws_ecs_task_definition.task_definition.arn_without_revision}",
    ]
    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [data.aws_ecs_cluster.cluster.arn]
    }
  }

  statement {
    sid    = "EcsPassRole"
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*"
    ]
    condition {
      test     = "StringLike"
      variable = "iam:PassedToService"
      values = [
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}
