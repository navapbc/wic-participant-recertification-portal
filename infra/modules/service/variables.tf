variable "service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "ssl_cert_arn" {
  type        = string
  description = "The arn of the SSL certificate for the HTTPS ALB listener"
}

variable "image_tag" {
  type        = string
  description = "The tag of the image to deploy"
}

variable "image_repository_url" {
  type        = string
  description = "The url of the container image repository"
}

variable "image_repository_arn" {
  type        = string
  description = "The arn of the container image repository"
}

variable "desired_instance_count" {
  type        = number
  description = "Number of instances of the task definition to place and keep running."
  default     = 1
}

variable "cpu" {
  type        = number
  default     = 256
  description = "Number of cpu units used by the task, expessed as an integer value, e.g 512 "
}

variable "memory" {
  type        = number
  default     = 512
  description = "Amount (in MiB) of memory used by the task. e.g. 2048"
}

variable "container_port" {
  type        = number
  description = "The port number on the container that's bound to the user-specified"
  default     = 8000
}

variable "container_env_vars" {
  type        = list(map(string))
  description = "Environment variables to pass to the container definition"
  default     = []
}

variable "container_secrets" {
  type        = list(map(string))
  description = "AWS secrets to pass to the container definition"
  default     = []
}

variable "container_efs_volumes" {
  description = "EFS volumes to be created and mounted into the container"
  type = map(object({
    volume_name      = string,
    container_path   = string,
    file_system_id   = string,
    file_system_arn  = string,
    access_point_id  = string,
    access_point_arn = string,
  }))
  default = {}
}

variable "container_bind_mounts" {
  description = "Bind mounts to be mounted into the container"
  type = map(object({
    volume_name    = string,
    container_path = string,
  }))
  default = {}
}

variable "container_read_only" {
  type        = bool
  description = "Whether the container root filesystem should be read-only"
  default     = true
}

variable "vpc_id" {
  type        = string
  description = "Uniquely identifies the VPC."
}

variable "subnet_ids" {
  type        = list(any)
  description = "Private subnet id from vpc module"
}

variable "service_cluster_arn" {
  type        = string
  description = "The arn of the service cluster that the service should be part of"
}

variable "ssm_resource_paths" {
  type        = list(string)
  description = "A list of ssm resource paths that the ECS task executor should have permission to access"
  default     = []
}

variable "enable_healthcheck" {
  type        = bool
  description = "Enable container healthcheck"
  default     = true
}

variable "healthcheck_path" {
  type        = string
  description = "The path to the application healthcheck"
  default     = "/health"
}

variable "healthcheck_type" {
  type        = string
  description = "Whether to configure a curl or wget healthcheck. curl is more common. use wget for alpine-based images"
  default     = "curl"
  validation {
    condition     = contains(["curl", "wget"], var.healthcheck_type)
    error_message = "choose either: curl or wget"
  }
}

variable "healthcheck_start_period" {
  type        = number
  description = "The optional grace period to provide containers time to bootstrap in before failed health checks count towards the maximum number of retries."
  default     = 0
}

variable "enable_exec" {
  type        = bool
  description = "Enable exec access to ECS task"
  default     = false
}

variable "service_deployment_maximum_percent" {
  type        = number
  description = "The service deployment maximum percent"
  default     = 200
}

variable "task_role_max_session_duration" {
  type        = number
  description = "The maximum session duration for the ECS task role (in seconds)"
  default     = 60 * 60 # 1 hour
}

variable "waf_name" {
  type        = string
  description = "The name of the WAF associated with this resource "
}
