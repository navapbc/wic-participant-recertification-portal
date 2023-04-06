variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "participant_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the participant service"
  default     = "latest"
}

variable "staff_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the staff service"
  default     = "latest"
}

variable "analytics_image_tag" {
  type        = string
  description = "Image tag to deploy to the environment for the analytics service"
  default     = "latest"
}

variable "enable_exec" {
  type        = bool
  description = "Enables ECS exec for all ECS services"
  default     = false
}
