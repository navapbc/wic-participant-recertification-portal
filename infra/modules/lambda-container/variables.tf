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