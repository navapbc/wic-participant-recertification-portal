variable "waf_name" {
  type        = string
  description = "Name for the firewall"
}

variable "waf_iam_name" {
  type        = string
  description = "Name of the IAM role associated with the firewall"
}
