variable "waf_name" {
  type        = string
  description = "Name for the firewall"
}

variable "waf_iam_name" {
  type        = string
  description = "Name of the IAM role associated with the firewall"
}

variable "waf_logging_name" {
  type        = string
  description = "Name of the logging group associated with the firewall"
}
