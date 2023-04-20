variable "user_pool_name" {
  type        = string
  description = "The name of the user pool the users should be created in"
}

variable "temporary_password_length" {
  type        = number
  description = "The length of the temporary password"
  default     = 15
}

variable "user_emails" {
  type        = list(string)
  description = "A list of emails addresses for users to create"
  default     = []
}