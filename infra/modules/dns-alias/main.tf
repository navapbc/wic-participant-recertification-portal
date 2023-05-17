############################################################################################
## A module for creating a DNS A record
## - Creates an A record and associates it with an application load balancer
## Note: This module assumes that the Route53 Hosted Zone has been created in the AWS Console
############################################################################################

data "aws_route53_zone" "hosted_zone" {
  name = var.hosted_zone_domain
}

data "aws_lb" "application_alb" {
  name = var.application_alb_name
}

resource "aws_route53_record" "alias_record" {
  name    = var.alias_url
  type    = "A"
  zone_id = data.aws_route53_zone.hosted_zone.id
  alias {
    name                   = data.aws_lb.application_alb.dns_name
    zone_id                = data.aws_lb.application_alb.zone_id
    evaluate_target_health = true
  }
}
