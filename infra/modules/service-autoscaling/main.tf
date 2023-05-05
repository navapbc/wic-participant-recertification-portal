locals {
  cpu_autoscaling_name = "${var.ecs_service_name}-cpu-autoscaling"
}

resource "aws_appautoscaling_target" "service" {
  max_capacity       = 5
  min_capacity       = 2
  resource_id        = "service/${var.ecs_cluster_name}/${var.ecs_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "service_cpu" {
  name               = local.cpu_autoscaling_name
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.service.resource_id
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.service.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 50
    scale_in_cooldown  = 300
    scale_out_cooldown = 300

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_iam_policy" "autoscale" {
  name        = "${var.ecs_service_name}-autoscale-role-policy"
  description = "A policy for ECS service autoscaling"
  policy      = data.aws_iam_policy_document.autoscale.json
}

data "aws_iam_policy_document" "autoscale" {
  # checkov:skip=CKV_AWS_109 Allow autoscaling to work
  # checkov:skip=CKV_AWS_111 Allow autoscaling to work
  # @TODO narrow resource list for autoscaling permissions
  statement {
    sid    = "AllowAutoScaling"
    effect = "Allow"
    actions = [
      "application-autoscaling:*",
      "ecs:DescribeServices",
      "ecs:UpdateService",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarmHistory",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:DescribeAlarmsForMetric",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:DisableAlarmActions",
      "cloudwatch:EnableAlarmActions",
      "iam:CreateServiceLinkedRole",
      "sns:CreateTopic",
      "sns:Subscribe",
      "sns:Get*",
      "sns:List*"
    ]

    resources = [
      "*"
    ]
  }
}

# Link access policies to the ECS task execution role.
resource "aws_iam_role_policy_attachment" "autoscale" {
  role       = var.ecs_task_executor_role_name
  policy_arn = aws_iam_policy.autoscale.arn
}

