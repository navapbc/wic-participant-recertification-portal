variable "ecs_cluster_name" {
  type        = string
  description = "The name of the ECS cluster to scale"
}

variable "ecs_service_name" {
  type        = string
  description = "The name of the ECS service to scale"
}

variable "ecs_task_executor_role_name" {
  type        = string
  description = "The name of the ECS task executor role to grant autoscale permissions to"
}