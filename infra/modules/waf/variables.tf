variable "waf_name" {
  type        = string
  description = "The name for the WAF Web ACL"
}

variable "waf_iam_name" {
  type        = string
  description = "The name of the IAM role for WAF logging"
}

variable "waf_logging_name" {
  type        = string
  description = "Name of the logging group associated with the firewall"
}
