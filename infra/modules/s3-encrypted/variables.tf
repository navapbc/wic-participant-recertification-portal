variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "read_role_arns" {
  type        = list(string)
  description = "task executor arn for the staff and participant portal applications"
}
variable "read_role_names" {
  type        = list(string)
  description = "task executor name for the staff and participant portal applications"
}
variable "s3_bucket_name" {
  type        = string
  description = "The s3 bucket used for document uploads"
}
