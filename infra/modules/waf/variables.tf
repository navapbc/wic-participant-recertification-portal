variable "waf_name" {
  type        = string
  description = "The name for the WAF Web ACL"
}

variable "waf_logging_name" {
  type        = string
  description = "The name of the logging group associated with the firewall"
}
