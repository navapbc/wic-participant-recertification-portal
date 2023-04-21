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

variable "participant_doc_upload_expiration" {
  type        = string
  description = "The maximum allowed number of seconds a presigned s3 url is active before it expires"
  default     = "604800"
}

variable "participant_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the participant service"
  default     = false
}

variable "staff_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the staff service"
  default     = false
}

variable "analytics_enable_exec" {
  type        = bool
  description = "Enables ECS exec for the analytics service"
  default     = false
}
variable "participant_url" {
  type        = string
  description = "URL to access the application"
  default     = "dev.wic-services.org"
}
variable "staff_url" {
  type        = string
  description = "URL to access the application"
  default     = "dev-staff.wic-services.org"
}
variable "analytics_url" {
  type        = string
  description = "URL to access the application"
  default     = "dev-analytics.wic-services.org"
}