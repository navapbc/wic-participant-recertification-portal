variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "write_role_names" {
  type        = list(string)
  description = "role names that have access to write s3 permissions"
  default     = []
}

variable "delete_role_names" {
  type        = list(string)
  description = "role names that have access to delete s3 permissions"
  default     = []
}

variable "read_role_names" {
  type        = list(string)
  description = "role names that have access to read s3 permissions"
  default     = []
}

variable "s3_bucket_name" {
  type        = string
  description = "The s3 bucket used for document uploads"
}
