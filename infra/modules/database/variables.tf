variable "database_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.database_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "admin_password" {
  description = "database admin password"
}
