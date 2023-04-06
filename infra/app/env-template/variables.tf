variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
}

variable "enable_exec" {
  type        = bool
  description = "Enables ECS exec for all ECS services"
  default     = false
}
