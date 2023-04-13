variable "analytics_service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.analytics_service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}
variable "staff_service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.staff_service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}
variable "participant_service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.participant_service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}
variable "environment_name" {
  type        = string
  description = "name of the application environment"
}