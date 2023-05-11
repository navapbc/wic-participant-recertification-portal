variable "schedule_name" {
  type        = string
  description = "The name of the Eventbridge schedule"
}

variable "cluster_name" {
  type        = string
  description = "The name of the ECS cluster the Eventbridge schedule will run the task in"
}

variable "task_definition_family" {
  type        = string
  description = "The name of the ECS task definition family that the Eventbridge schedule will run"
}

variable "container_name" {
  type        = string
  description = "The name of the container to override"
}

variable "container_override_command" {
  type        = string
  description = "The command to override the container with"
}

variable "security_group_ids" {
  type        = list(string)
  description = "The security group IDs associated with the task"
}

variable "subnet_ids" {
  type        = list(string)
  description = "The subnet IDs associated with the ECS task"
}

variable "schedule_expression" {
  type        = string
  description = "The Eventbridge schedule expression. See https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html"
}

variable "schedule_expression_timezone" {
  type        = string
  description = "The timezone the schedule expression is in. See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
}

variable "schedule_enabled" {
  type        = bool
  description = "Whether the schedule should be enabled or not"
}
