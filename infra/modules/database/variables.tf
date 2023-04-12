variable "database_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.database_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "admin_password" {
  description = "The admin password for the database. Optional. Will generate a random password if not set"
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_type" {
  type        = string
  description = "Whether to configure a postgresql or mysql database"
  default     = "postgresql"
  validation {
    condition     = contains(["postgresql", "mysql"], var.database_type)
    error_message = "choose either: postgresql or mysql"
  }
}

variable "database_port" {
  type        = number
  description = "The port number for accessing the database"
  default     = 5432
}

variable "deletion_protection" {
  type        = bool
  description = "Whether to enable database deletion protection. Defaults to true"
  default     = true
}