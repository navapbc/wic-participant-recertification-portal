resource "aws_wafv2_web_acl" "waf" {
  # checkov:skip=CKV2_AWS_31: Need to ask team about using Firehose
  name        = "wic-prp-waf"
  description = "Managed ruleset for the WIC PRP project."
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "BasicRules"
    priority = 1

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          action_to_use {
            count {}
          }

          name = "SizeRestrictions_QUERYSTRING"
        }

        rule_action_override {
          action_to_use {
            count {}
          }

          name = "NoUserAgent_HEADER"
        }

        scope_down_statement {
          geo_match_statement {
            country_codes = ["US"]
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "waf-rules-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name     = "ManageKnownBadInputs"
    priority = 1
    # setting to none re this solution here: https://github.com/bridgecrewio/checkov/issues/2101
    # count rule override: https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-rule-group-override-options.html#web-acl-rule-group-override-options-rule-group
    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                = "waf-general-metrics"
    sampled_requests_enabled   = false
  }
}

# AWS 31 (WAF needs a logging config) Needs three services:
# 1. WAF to generate logs
# 2. Kinesis Firehose to recieve logs
# 3. S3 to store the logs.
