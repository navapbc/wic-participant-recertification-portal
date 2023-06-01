# referencing the record that already exists in the console
data "aws_route53_zone" "project_url" {
  name = "wic-services.org"
}

data "aws_lb" "participant_alb" {
  name = var.participant_service_name
}

data "aws_lb" "analytics_alb" {
  name = var.analytics_service_name
}
#
# Participant
#

# creating subdomains for each env (except prod)
# create var for url
# ALIAS record for subdomains
resource "aws_route53_record" "participant_alias_record" {
  name    = var.participant_url
  type    = "A"
  zone_id = data.aws_route53_zone.project_url.id
  alias {
    name                   = data.aws_lb.participant_alb.dns_name
    zone_id                = data.aws_lb.participant_alb.zone_id
    evaluate_target_health = true
  }
}

#
# Staff
#


# ALIAS record for subdomains
# resource "aws_route53_record" "staff_alias_record" {
#   name    = var.staff_url
#   type    = "A"
#   zone_id = data.aws_route53_zone.project_url.id
#   alias {
#     name                   = data.aws_lb.staff_alb.dns_name
#     zone_id                = data.aws_lb.staff_alb.zone_id
#     evaluate_target_health = true
#   }
# }

#
# Analytics
#

# resource "aws_route53_zone" "analytics_url" {

# ALIAS record for subdomains
resource "aws_route53_record" "analytics_alias_record" {
  name    = var.analytics_url
  type    = "A"
  zone_id = data.aws_route53_zone.project_url.id
  alias {
    name                   = data.aws_lb.analytics_alb.dns_name
    zone_id                = data.aws_lb.analytics_alb.zone_id # this needs to be the load balancer
    evaluate_target_health = true
  }
}


# DNSSEC for the hosted zone
# resource "aws_route53_hosted_zone_dnssec" "project_url" {
#   hosted_zone_id =
# }
