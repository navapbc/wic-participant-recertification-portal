variable "hosted_zone_domain" {
  type        = string
  description = "The name of an existing Route53 hosted zone domain"
}

variable "application_alb_name" {
  type        = string
  description = "The name of the application load balancer to point this A record at"
}

variable "alias_url" {
  type        = string
  description = "The url for the A record"
}
