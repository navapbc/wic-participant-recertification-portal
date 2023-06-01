variable "function_name" {
  type        = string
  description = "The name of the lambda function"
}

variable "image_repository_name" {
  type        = string
  description = "The name of the image repository"
}

variable "image_tag" {
  type        = string
  description = "The tag for the image to deploy"
}

variable "container_secrets" {
  type        = map(string)
  description = "Key/value maps of environment variables to parameter names"
}

variable "container_env_vars" {
  type        = map(string)
  description = "Key/value map of environment variables to values"
}

variable "staff_url" {
  type        = string
  description = "The URL for the staff portal"
}
