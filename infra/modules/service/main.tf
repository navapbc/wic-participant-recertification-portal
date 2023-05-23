############################################################################################
## A module to create an ECS service, with associated ECS task
## - Creates an application load balancer for the ECS service
## - Creates an ECS service
## - Creates an ECS task definition
## - Configures logging to Cloudwatch Logs
## - Creates a ECS task role
## - Creates a ECS task execution role
## - Creates a security group to allow traffic to reach the application load balancer
## - Creates a security group to allow traffic from the application load balancer to reach
##   the ECS task
##
## Note: This module assumes that the SSL certificate has been created in the AWS Console
##
## Note: By default, this module ignores changes to the ECS service task definition and ignores changes to the ECS task
## definition container definitions so that Github Actions can manage deploys by creating new task definition versions.
## Sometimes we need to deploy updates to container definitions and update the ECS service. Normally, we would control
## this behavior with a variable. However, terraform currently doesn't support expression evaluation in the `lifecycle`
## block. See https://github.com/hashicorp/terraform/issues/3116
##
## To change this, TEMPORARILY comment out the lines following:
##  `IGNORE_GITHUB_CHANGES - comment out this line to deploy changes via terraform`
############################################################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  alb_name                    = var.service_name
  log_group_name              = "service/${var.service_name}"
  task_role_name              = "${var.service_name}-task"
  task_executor_role_name     = "${var.service_name}-task-executor"
  image_url                   = "${var.image_repository_url}:${var.image_tag}"
  healthcheck_path            = trimprefix(var.healthcheck_path, "/")
  create_ecs_task_role_policy = length(var.container_efs_volumes) > 0 || var.enable_exec
}

############################################################################################
## Load balancer
## - Routes all unencrypted traffic on port 80 to HTTPS on port 443
## - Routes all HTTPS traffic on port 443 to the ALB target group
## - Creates a load balancer target group
##   - Optionally configures a healthcheck that looks for HTTP response 200 on the
##     healthcheck endpoint
############################################################################################

resource "aws_lb" "alb" {
  name            = var.service_name
  idle_timeout    = "120"
  internal        = false
  security_groups = [aws_security_group.alb.id]
  subnets         = var.subnet_ids

  # TODO(https://github.com/navapbc/template-infra/issues/161) Prevent deletion protection
  # checkov:skip=CKV_AWS_150:Allow deletion until we can automate deletion for automated tests
  # enable_deletion_protection = true

  # TODO(https://github.com/navapbc/template-infra/issues/165) Protect ALB with WAF
  # checkov:skip=CKV2_AWS_28:Implement WAF in issue #165

  # Drop invalid HTTP headers for improved security
  # Note that header names cannot contain underscores
  # https://docs.bridgecrew.io/docs/ensure-that-alb-drops-http-headers
  drop_invalid_header_fields = true

  access_logs {
    enabled = true
    prefix  = var.service_name
    bucket  = var.service_name
  }
}

resource "aws_lb_listener" "alb_listener_http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "alb_listener_https" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.ssl_cert_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group.arn
  }
}

resource "aws_lb_listener_rule" "alb_http_forward" {
  listener_arn = aws_lb_listener.alb_listener_https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}


resource "aws_lb_target_group" "alb_target_group" {
  # you must use a prefix, to facilitate successful tg changes
  name_prefix                   = "tg-"
  port                          = var.container_port
  protocol                      = "HTTP"
  vpc_id                        = var.vpc_id
  target_type                   = "ip"
  deregistration_delay          = "30"
  load_balancing_algorithm_type = "least_outstanding_requests"

  dynamic "health_check" {
    for_each = var.enable_healthcheck ? [0] : []
    content {
      path                = "/${local.healthcheck_path}"
      port                = var.container_port
      healthy_threshold   = 2
      unhealthy_threshold = 10
      interval            = 30
      timeout             = 29
      matcher             = "200"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

############################################################################################
## ECS Service execution
## - Configures an ECS service using FARGATE launch type
## - Configures the ECS service to use the load balancer target group
############################################################################################

resource "aws_ecs_service" "app" {
  # checkov:skip=CKV_AWS_333:Disabling public IP will mess up AWS service discovery

  # Fargate platform_version must be at least 1.4.0 for Fargate + EFS to work
  # LATEST is currently 1.4.0
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform-linux-fargate.html
  name                       = var.service_name
  cluster                    = var.service_cluster_arn
  launch_type                = "FARGATE"
  task_definition            = aws_ecs_task_definition.app.arn
  desired_count              = var.desired_instance_count
  platform_version           = "LATEST"
  deployment_maximum_percent = var.service_deployment_maximum_percent
  enable_execute_command     = var.enable_exec ? true : null

  # Allow changes to the desired_count without differences in terraform plan.
  # This allows autoscaling to manage the desired count for us.
  lifecycle {
    ignore_changes = [
      desired_count,
      task_definition, # IGNORE_GITHUB_CHANGES - comment out this line to deploy changes via terraform
    ]
  }

  network_configuration {
    # TODO(https://github.com/navapbc/template-infra/issues/152) set assign_public_ip = false after using private subnets
    assign_public_ip = true
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.alb_target_group.arn
    container_name   = var.service_name
    container_port   = var.container_port
  }
}

############################################################################################
## ECS Task definition
## - Configures the JSON container definitions
##   - Passes in the specified environment variables
##   - Passes in the specified AWS-managed secrets
##   - Optionally configures the container's root filesystem to be read-only
##   - Optionally configures a healthcheck that is either curl-based or wget-based
##   - (Required for Fargate) Disable all linux runtime capabilities
##   - Use an init process
##   - Configure logging to Cloudwatch Logs
##   - Optionally support persistent data using either (ephemeral) container bind-mounts
##     or EFS
############################################################################################

resource "aws_ecs_task_definition" "app" {
  family             = var.service_name
  execution_role_arn = aws_iam_role.task_executor.arn
  task_role_arn      = aws_iam_role.task.arn
  container_definitions = jsonencode(
    [
      {
        name                   = var.service_name
        image                  = local.image_url
        memory                 = var.memory
        cpu                    = var.cpu
        networkMode            = "awsvpc"
        essential              = true
        environment            = var.container_env_vars
        readonlyRootFilesystem = var.container_read_only
        secrets                = var.container_secrets
        healthCheck = var.enable_healthcheck ? {
          command = [
            "CMD-SHELL",
            var.healthcheck_type == "curl" ? "curl --fail http://localhost:${var.container_port}/${local.healthcheck_path} || exit 1" : "wget --no-verbose --tries=1 --spider http://localhost:${var.container_port}/${local.healthcheck_path} || exit 1",
          ],
          interval    = 30,
          retries     = 3,
          timeout     = 5,
          startPeriod = var.healthcheck_start_period,
        } : null
        portMappings = [
          {
            containerPort = "${var.container_port}",
            hostPort      = "${var.container_port}",
            protocol      = "tcp",
          }
        ]
        linuxParameters = {
          capabilities = {
            drop = ["ALL"],
          },
          initProcessEnabled = true
        }
        logConfiguration = {
          logDriver = "awslogs",
          options = {
            "awslogs-group"         = aws_cloudwatch_log_group.service_logs.name,
            "awslogs-region"        = data.aws_region.current.name,
            "awslogs-stream-prefix" = var.service_name
          },
        }
        # A slightly complicated loop to iterate over the var.container_bind_mounts list
        # and the var.container_efs_volumes list and create a map for each volume defined
        mountPoints = [for key, value in merge(var.container_bind_mounts, var.container_efs_volumes) :
          {
            containerPath = value.container_path,
            sourceVolume  = value.volume_name,
            readOnly      = false,
          }
        ]
        volumesFrom = []
      }
    ]
  )

  cpu    = var.cpu
  memory = var.memory

  requires_compatibilities = ["FARGATE"]

  # Reference https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html
  network_mode = "awsvpc"

  # Create an EFS mount volume for each element in the var.container_efs_volumes list
  dynamic "volume" {
    for_each = var.container_efs_volumes
    content {
      name = volume.value.volume_name
      efs_volume_configuration {
        file_system_id     = volume.value.file_system_id
        transit_encryption = "ENABLED"
        authorization_config {
          access_point_id = volume.value.access_point_id
          iam             = "ENABLED"
        }
      }
    }
  }

  # Create a bind mount volume for each element in the var.container_bind_mounts list
  dynamic "volume" {
    for_each = var.container_bind_mounts
    content {
      name = volume.value.volume_name
    }
  }

  lifecycle {
    ignore_changes = [
      container_definitions, # IGNORE_GITHUB_CHANGES - comment out next line to deploy changes via terraform
    ]
  }
}

############################################################################################
## Logging using Cloudwatch Logs
############################################################################################

# Cloudwatch log group to for streaming ECS application logs.
resource "aws_cloudwatch_log_group" "service_logs" {
  name = local.log_group_name

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}
####################
## Logging Bucket ##
####################

module "alb_logging" {
  source            = "../s3-encrypted"
  s3_bucket_name    = var.service_name
  log_target_prefix = var.service_name
}

############################################################################################
## IAM role: ECS task executor
## - Grants access to Cloudwatch Logs, ECR, and specified SSM secrets
## Note: ECS task execution roles allow the ECS agent to make AWS API calls, such as to
##       Cloudwatch Logs or ECR
############################################################################################

resource "aws_iam_role" "task_executor" {
  name               = local.task_executor_role_name
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_task_executor_role.json
}

data "aws_iam_policy_document" "ecs_assume_task_executor_role" {
  statement {
    sid = "ECSTaskExecution"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "task_executor" {
  name        = "${var.service_name}-task-executor-role-policy"
  description = "A policy for ECS task execution"
  policy      = data.aws_iam_policy_document.task_executor.json
}

# Link access policies to the ECS task execution role.
resource "aws_iam_role_policy_attachment" "task_executor" {
  role       = aws_iam_role.task_executor.name
  policy_arn = aws_iam_policy.task_executor.arn
}

data "aws_iam_policy_document" "task_executor" {
  # Allow ECS to log to Cloudwatch.
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["${aws_cloudwatch_log_group.service_logs.arn}:*"]
  }

  # Allow ECS to authenticate with ECR
  statement {
    sid = "ECRAuth"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  # Allow ECS to download images.
  statement {
    sid = "ECRPullAccess"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [var.image_repository_arn]
  }
  # Allow ECS to access Parameter Store for specific resources
  # But only include the statement if var.ssm_resource_paths is not empty
  dynamic "statement" {
    for_each = var.ssm_resource_paths
    content {
      sid = "SSMAccess${statement.key}"
      actions = [
        "ssm:GetParameters",
      ]
      resources = [statement.value]
    }
  }
}

############################################################################################
## IAM role: ECS task
## - Optional grants access to SSM for ECS Exec
## - Optional grants access to EFS
## - Only created if ECS Exec or EFS is required
## Note: ECS task roles allow the container inside the ECS task to assume IAM roles to call
##       AWS APIs
############################################################################################

resource "aws_iam_role" "task" {
  name                 = local.task_role_name
  assume_role_policy   = data.aws_iam_policy_document.ecs_assume_task_role.json
  max_session_duration = var.task_role_max_session_duration
}

data "aws_iam_policy_document" "ecs_assume_task_role" {
  statement {
    sid = "ECSTask"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "task" {
  count       = local.create_ecs_task_role_policy ? 1 : 0
  name        = "${var.service_name}-task-role-policy"
  description = "A policy for ECS task"
  policy      = data.aws_iam_policy_document.task.json
}

resource "aws_iam_role_policy_attachment" "task" {
  count      = local.create_ecs_task_role_policy ? 1 : 0
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task[0].arn
}

data "aws_iam_policy_document" "task" {
  # Allow ECS to access SSM Messages so that ECS Exec works
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  dynamic "statement" {
    for_each = var.enable_exec ? [0] : []
    content {
      sid    = "SSMAccess"
      effect = "Allow"
      actions = [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel",
      ]
      resources = ["*"]
    }
  }

  # Allow ECS to access EFS access points
  dynamic "statement" {
    for_each = var.container_efs_volumes
    content {
      sid    = "EFSAccess${statement.key}"
      effect = "Allow"
      actions = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:ClientRootAccess",
      ]
      resources = [
        statement.value.file_system_arn
      ]
      condition {
        test     = "StringEquals"
        variable = "elasticfilesystem:AccessPointArn"
        values = [
          statement.value.access_point_arn
        ]
      }
    }
  }
}

############################################################################################
## Network Configuration: Security groups
## - Creates a security group for the application load balancer which allows all inbound
##   public traffic on ports 80 and 443 to reach the ALB
## - Creates a security group for the application to allow all traffic from the ALB to reach
##   the application on the container port
############################################################################################

resource "aws_security_group" "alb" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-alb"
  description = "Allow TCP traffic to application load balancer"

  lifecycle {
    create_before_destroy = true

    # changing the description is a destructive change
    # just ignore it
    ignore_changes = [description]
  }

  vpc_id = var.vpc_id
  # checkov:skip=CKV_AWS_260: HTTP redirect won't work unless the security group allows port 80 traffic
  ingress {
    description = "Allow HTTP traffic from public internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS traffic from public internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outgoing traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group to allow access to Fargate tasks
resource "aws_security_group" "app" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-app"
  description = "Allow inbound TCP access to application container port"
  lifecycle {
    create_before_destroy = true
  }

  ingress {
    description     = "Allow HTTP traffic to application container port"
    protocol        = "tcp"
    from_port       = var.container_port
    to_port         = var.container_port
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outgoing traffic from application"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

##############################################
## WAF Association
##############################################
data "aws_wafv2_web_acl" "waf" {
  name  = var.waf_name
  scope = "REGIONAL"
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.alb.arn # load balancer arn
  web_acl_arn  = data.aws_wafv2_web_acl.waf.arn
}
