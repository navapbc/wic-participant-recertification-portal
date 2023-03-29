data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  alb_name                = var.service_name
  log_group_name          = "service/${var.service_name}"
  task_role_name          = "${var.service_name}-task"
  task_executor_role_name = "${var.service_name}-task-executor"
  image_url               = "${var.image_repository_url}:${var.image_tag}"
  healthcheck_path        = trimprefix(var.healthcheck_path, "/")
}

###################
## Load balancer ##
###################

# ALB for an application running in ECS
resource "aws_lb" "alb" {
  name            = var.service_name
  idle_timeout    = "120"
  internal        = false
  security_groups = [aws_security_group.alb.id]
  subnets         = var.subnet_ids

  # TODO(https://github.com/navapbc/template-infra/issues/163) Implement HTTPS
  # checkov:skip=CKV2_AWS_20:Redirect HTTP to HTTPS as part of implementing HTTPS support

  # TODO(https://github.com/navapbc/template-infra/issues/161) Prevent deletion protection
  # checkov:skip=CKV_AWS_150:Allow deletion until we can automate deletion for automated tests
  # enable_deletion_protection = true

  # TODO(https://github.com/navapbc/template-infra/issues/165) Protect ALB with WAF
  # checkov:skip=CKV2_AWS_28:Implement WAF in issue #165

  # Drop invalid HTTP headers for improved security
  # Note that header names cannot contain underscores
  # https://docs.bridgecrew.io/docs/ensure-that-alb-drops-http-headers
  drop_invalid_header_fields = true

  # TODO(https://github.com/navapbc/template-infra/issues/162) Add access logs
  # checkov:skip=CKV_AWS_91:Add access logs in future PR
}

# NOTE: for the demo we expose private http endpoint
# due to the complexity of acquiring a valid TLS/SSL cert.
# In a production system we would provision an https listener
resource "aws_lb_listener" "alb_listener_http" {
  # TODO(https://github.com/navapbc/template-infra/issues/163) Use HTTPS protocol
  # checkov:skip=CKV_AWS_2:Implement HTTPS in issue #163
  # checkov:skip=CKV_AWS_103:Require TLS 1.2 as part of implementing HTTPS support

  load_balancer_arn = aws_lb.alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "alb_http_forward" {
  listener_arn = aws_lb_listener.alb_listener_http.arn
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
  name_prefix          = "tg-"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = "30"

  health_check {
    path                = "/${local.healthcheck_path}"
    port                = var.container_port
    healthy_threshold   = 2
    unhealthy_threshold = 10
    interval            = 30
    timeout             = 29
    matcher             = "200-299"
  }

  lifecycle {
    create_before_destroy = true
  }
}

#################
## File System ##
#################

module "fs" {
  for_each        = var.container_efs_volumes
  source          = "../file-system"
  name            = each.value.volume_name
  subnet_ids      = var.subnet_ids
  security_groups = [aws_security_group.app.id]
}

#######################
## Service Execution ##
#######################

resource "aws_ecs_service" "app" {
  name            = var.service_name
  cluster         = var.service_cluster_arn
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_instance_count

  # Allow changes to the desired_count without differences in terraform plan.
  # This allows autoscaling to manage the desired count for us.
  # Ignoring the task_definition allows the task revision to not get reverted if a rew revision is created outside of terraform.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
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

resource "aws_ecs_task_definition" "app" {
  family             = var.service_name
  execution_role_arn = aws_iam_role.task_executor.arn
  task_role_arn      = aws_iam_role.task.arn

  # when is this needed?
  # task_role_arn      = aws_iam_role.api_service.arn
  container_definitions = jsonencode(
    [
      {
        name                   = var.service_name
        image                  = local.image_url
        memory                 = var.memory
        cpu                    = var.cpu
        networkMode            = "awsvpc"
        essential              = true
        entryPoint             = null
        environment            = var.container_env_vars
        readonlyRootFilesystem = var.container_read_only
        secrets                = var.container_secrets
        healthCheck = {
          command = [
            "CMD-SHELL",
            "wget --no-verbose --tries=1 --spider http://localhost:${var.container_port}/${local.healthcheck_path} || exit 1",
          ],
          interval = 30,
          retries  = 3,
          timeout  = 5,
        }
        portMappings = [
          {
            containerPort = var.container_port,
            hostPort      = var.container_port,
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
        # A slightly complicated nested loop to iterate over the var.container_named_valumes list
        # and create a map for each volume it defines
        mountPoints = [for key, value in merge(var.container_bind_mounts, var.container_efs_volumes) :
          {
            containerPath = value.container_path,
            sourceVolume  = value.volume_name
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

  // Create a bind mount volume for each element in the var.container_bind_mounts list
  dynamic "volume" {
    for_each = module.fs
    content {
      name = volume.value.name
      efs_volume_configuration {
        file_system_id     = volume.value.file_system.id
        transit_encryption = "ENABLED"
        authorization_config {
          access_point_id = volume.value.access_point.id
          iam             = "ENABLED"
        }
      }
    }
  }

  // Create an EFS mount volume for each element in the var.container_efs_volumes list
  dynamic "volume" {
    for_each = var.container_bind_mounts
    content {
      name = volume.value.volume_name
    }
  }
}

##########
## Logs ##
##########

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
## Access Control ##
####################

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
  # But only include the statement if var.service_ssm_resource_paths is not empty
  dynamic "statement" {
    for_each = var.service_ssm_resource_paths
    content {
      sid = "SSMAccess${statement.key}"
      actions = [
        "ssm:GetParameters",
      ]
      resources = ["arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${statement.value}"]
    }
  }
}

resource "aws_iam_role" "task" {
  name               = local.task_role_name
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_task_role.json
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
  name        = "${var.service_name}-task-role-policy"
  description = "A policy for ECS task"
  policy      = data.aws_iam_policy_document.task.json
}

# Link access policies to the ECS task role.
resource "aws_iam_role_policy_attachment" "task" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task.arn
}

data "aws_iam_policy_document" "task" {
  statement {
    sid    = "DenyOtherwise"
    effect = "Deny"
    actions = [
      "elasticfilesystem:Client*",
    ]
    resources = ["*"]
  }
  # Allow ECS to access EFS access points
  dynamic "statement" {
    for_each = module.fs
    content {
      sid    = "EFSAccess${statement.key}"
      effect = "Allow"
      actions = [
        "elasticfilesystem:Client*",
      ]
      resources = [
        statement.value.file_system.arn
      ]
      condition {
        test     = "StringEquals"
        variable = "elasticfilesystem:AccessPointArn"
        values = [
          statement.value.access_point.arn
        ]
      }
    }
  }
}

###########################
## Network Configuration ##
###########################

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

  # TODO(https://github.com/navapbc/template-infra/issues/163) Disallow incoming traffic to port 80
  # checkov:skip=CKV_AWS_260:Disallow ingress from 0.0.0.0:0 to port 80 when implementing HTTPS support in issue #163
  ingress {
    description = "Allow HTTP traffic from public internet"
    from_port   = 80
    to_port     = 80
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
