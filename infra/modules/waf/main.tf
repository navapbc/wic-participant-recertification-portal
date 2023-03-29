resource "aws_wafv2_web_acl" "waf" {
  # checkov:skip=CKV2_AWS_31: Need to ask team about using Firehose
  name        = "wic-prp-waf"
  description = "Managed ruleset for the WIC PRP project."
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSGeneralRules"
    priority = 1

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "waf-rules-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name     = "AWSManageKnownBadInputs"
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

  rule {
    name        = "AWSIPReputationList"
    description = "Inspect IPs that have been identified as bots by Amazon"
    priority    = 1
    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "ip-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name        = "AWSAnonList"
    description = "Inspects IPs for services known to anonymize client information e.g. proxies"
    override_action { # does this need an override?
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "ip-anon-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name        = "AWSSQLManagement"
    description = " Blocks requests associated with SQL database exploitation"

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "sql-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name        = "AWSLinuxManagement"
    description = " Blocks requests associated with Linux exploitation"

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "linux-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name        = "AWSUnixManagement"
    description = " Blocks requests associated with POSIX and POSIX-like OS exploitation"

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "unix-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                = "waf-general-metrics"
    sampled_requests_enabled   = false
  }
  # the following are custom rules and arent managed by AWS.
  rule {
    name     = "AWSRateBasedRuleDomesticDOS"
    description = "Applies a rate based rule to IPs originating in the US"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000 # max number of requests per 5-minute period from a single originating IP address
        aggregate_key_type = "IP"

        scope_down_statement {
          geo_match_statement {
            country_codes = ["US"]
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "domestic-dos-metrics"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSRateBasedRuleGlobalDOS"
    description = "Applies a rate based rule to IPs originating outside of the US"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 500 # max number of requests per 5-minute period from a single originating IP address
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              geo_match_statement {
                country_codes = ["US"]
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "global-dos-metrics"
      sampled_requests_enabled   = true
    }
  }
}

# AWS 31 (WAF needs a logging config) Needs three services:
# 1. WAF to generate logs
# 2. Kinesis Firehose to recieve logs
# 3. S3 to store the logs.
