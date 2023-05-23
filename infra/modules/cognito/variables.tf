variable "pool_name" {
  type        = string
  description = "The name of the Cognito user pool"
}

variable "password_minimum_length" {
  type        = number
  description = "The password minimum length"
  default     = 8
}

variable "temporary_password_validity_days" {
  type        = number
  description = "The number of days a temporary password is valid for"
  default     = 7
}

variable "email_sending_account" {
  type        = string
  description = "Whether to use the default cognito email service or to use AWS SES"
  default     = "COGNITO_DEFAULT"
  validation {
    condition     = contains(["COGNITO_DEFAULT", "DEVELOPER"], var.email_sending_account)
    error_message = "choose either: COGNITO_DEFAULT or DEVELOPER"
  }
}

variable "from_email_address" {
  type        = string
  description = "The sender's email address or the sender's display name and email address"
  default     = ""
}

variable "reply_to_email_address" {
  type        = string
  description = "The REPLY-TO email address"
  default     = ""
}

variable "email_source_arn" {
  type        = string
  description = "The arn of the SES verified email identity if using email_sending_account == DEVELOPER"
  default     = ""
}

variable "invite_email_message" {
  type        = string
  description = "The email body for an account invitation email sent by an admin user. Must contain {username} and {####} placeholders, for username and temporary password, respectively."
  default     = ""
}

variable "invite_email_subject" {
  type        = string
  description = "The email subject for an account invitation email sent by an admin user"
  default     = ""
}

variable "verification_email_message" {
  type        = string
  description = "The email body for a password reset email. Must contain the {####} placeholder."
  default     = ""
}

variable "verification_email_subject" {
  type        = string
  description = "The email subject for a password reset email"
  default     = ""
}

variable "client_allowed_oauth_flows" {
  type        = list(string)
  description = "The list of allowed user pool client OAuth flows"
  default     = ["code"]
}

variable "client_allowed_oauth_scopes" {
  type        = list(string)
  description = "The list of allowed user pool client OAuth scopes"
  default     = ["openid", "email"]
}

variable "client_generate_secret" {
  type        = bool
  description = "Whether the user pool client should generate a client secret"
  default     = true
}

variable "client_callback_urls" {
  type        = list(string)
  description = "The list of allowed callback urls for the client user pool"
  default     = []
}

variable "client_logout_urls" {
  type        = list(string)
  description = "The list of allowed logout urls for the client user pool"
  default     = []
}

variable "client_domain" {
  type        = string
  description = "The domain that the user pool client hosted UI should be hosted at"
}

variable "hosted_zone_domain" {
  type        = string
  description = "The aws_route53_zone domain"
}

variable "waf_name" {
  type        = string
  description = "The name of the WAF associated with this resource "
}
