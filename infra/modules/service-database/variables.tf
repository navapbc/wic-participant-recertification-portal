variable "database_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.database_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "database_port" {
  type        = number
  description = "The port number for accessing the database"
  default     = 5432
}

variable "allowed_security_groups" {
  type        = list(string)
  description = "The list of security groups that can be allowed ingress"
  default     = []
}
