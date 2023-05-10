data "aws_caller_identity" "current" {}
resource "aws_wafv2_web_acl" "waf" {
  name        = var.waf_name
  description = "Managed ruleset for WAF."
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSGeneralRules"
    priority = 0

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
      cloudwatch_metrics_enabled = true
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
      cloudwatch_metrics_enabled = true
      metric_name                = "vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    # Inspect IPs that have been identified as bots by Amazon
    name     = "AWSIPReputationList"
    priority = 2
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
      cloudwatch_metrics_enabled = true
      metric_name                = "ip-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    # Inspects IPs for services known to anonymize client information e.g. proxies
    name     = "AWSAnonList"
    priority = 3
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
      cloudwatch_metrics_enabled = true
      metric_name                = "ip-anon-metrics"
      sampled_requests_enabled   = true
    }
  }

  rule {
    # Blocks requests associated with SQL database exploitation
    name     = "AWSSQLManagement"
    priority = 4
    override_action {
      count {}
    }
    # add a block block here
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    # Blocks requests associated with Linux exploitation
    name     = "AWSLinuxManagement"
    priority = 5
    override_action {
      count {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "linux-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }

  rule {
    # Blocks requests associated with POSIX and POSIX-like OS exploitation
    name     = "AWSUnixManagement"
    priority = 6
    override_action {
      count {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "unix-vulnerability-metrics"
      sampled_requests_enabled   = false
    }
  }
  # the following are custom rules and arent managed by AWS.
  rule {
    # Applies a rate based rule to IPs originating in the US
    name     = "AWSRateBasedRuleDomesticDOS"
    priority = 7

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
      sampled_requests_enabled   = false
    }
  }

  rule {
    # Applies a rate based rule to IPs originating outside of the US
    name     = "AWSRateBasedRuleGlobalDOS"
    priority = 8

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
      sampled_requests_enabled   = false
    }
  }
  rule {
    name     = "BlockSuspiciousPOST"
    priority = 9
    action {
      block {}
    }
    statement {
      and_statement {
        statement {
          byte_match_statement {
            search_string         = "POST"
            positional_constraint = "EXACTLY"
            field_to_match {
              method {}
            }
            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
        statement {
          byte_match_statement {
            search_string         = "/"
            positional_constraint = "EXACTLY"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockSuspiciousPOST"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "waf-general-metrics"
    sampled_requests_enabled   = false
  }
}

# Remove Firehose in favor of using cloudwatch for query purposes
# logging configuration resource

# resource "aws_wafv2_web_acl_logging_configuration" "waf_logging" {
#   log_destination_configs = [aws_kinesis_firehose_delivery_stream.waf_logging.arn]
#   resource_arn            = aws_wafv2_web_acl.waf.arn
# }
# # firehose to recieve logs
# resource "aws_kinesis_firehose_delivery_stream" "waf_logging" {
#   name        = "aws-waf-logs-metrics-stream"
#   destination = "extended_s3"
#   server_side_encryption {
#     enabled  = true
#     key_type = "CUSTOMER_MANAGED_CMK"
#     key_arn  = module.s3_encrypted_bucket.bucket_kms_arn
#   }
#   extended_s3_configuration {
#     role_arn   = aws_iam_role.firehose_perms.arn
#     bucket_arn = module.s3_encrypted_bucket.encrypted_bucket_arn
#   }
# }

# # IAM Role for Kinesis
# resource "aws_iam_role" "firehose_perms" {
#   name               = var.waf_iam_name
#   description        = "IAM role for the KDF"
#   assume_role_policy = data.aws_iam_policy_document.firehose_assume_role.json
# }

# # assume role
# data "aws_iam_policy_document" "firehose_assume_role" {
#   statement {
#     effect  = "Allow"
#     actions = ["sts:AssumeRole"]
#     principals {
#       type        = "Service"
#       identifiers = ["firehose.amazonaws.com"]
#     }
#   }
# }
resource "aws_cloudwatch_log_group" "waf" {
  name = "aws-waf-logs-wic-prp"
}
# # role policy
# data "aws_iam_policy_document" "firehose_perms" {
#   statement {
#     sid    = "AccessKDF"
#     effect = "Allow"
#     actions = [
#       "kinesis:Get*",
#       "kinesis:PutRecord",
#       "s3:GetBucket",
#       "s3:PutObject"
#     ]
#     resources = [module.s3_encrypted_bucket.encrypted_bucket_arn, "${module.s3_encrypted_bucket.encrypted_bucket_arn}/*"]
#   }
# }

# s3 logging bucket; this is a refactor to DRY up the code
module "s3_encrypted_bucket" {
  source           = "../s3-encrypted"
  s3_bucket_name   = "wic-prp-waf"
  environment_name = "waf"
}

resource "aws_s3_bucket_lifecycle_configuration" "waf_logging" {
  bucket                = module.s3_encrypted_bucket.encrypted_bucket_id
  expected_bucket_owner = data.aws_caller_identity.current.account_id

  rule {
    id     = "move-s3-to-ia"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 15
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}
