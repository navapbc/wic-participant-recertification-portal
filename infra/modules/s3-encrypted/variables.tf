variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket"
}

variable "s3_logging_bucket_id" {
  type        = string
  description = "The ID for the s3 bucket used for logging for this bucket"
}

variable "read_group_names" {
  type        = list(string)
  description = "A list of names for IAM groups that should have access to read access to the encrypted S3 bucket"
  default     = []
}

variable "write_group_names" {
  type        = list(string)
  description = "A list of names for IAM groups that should have access to write access to the encrypted S3 bucket"
  default     = []
}

variable "delete_group_names" {
  type        = list(string)
  description = "A list of names for IAM groups that should have access to delete access to the encrypted S3 bucket"
  default     = []
}

