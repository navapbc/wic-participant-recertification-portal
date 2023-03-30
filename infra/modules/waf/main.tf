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
      cloudwatch_metrics_enabled = true
      metric_name                = "waf-rules-metrics"
      sampled_requests_enabled   = true
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
      sampled_requests_enabled   = true
    }
  }

  rule {
    # Inspect IPs that have been identified as bots by Amazon
    name     = "AWSIPReputationList"
    priority = 1
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
      sampled_requests_enabled   = true
    }
  }

  rule {
    # Inspects IPs for services known to anonymize client information e.g. proxies
    name     = "AWSAnonList"
    priority = 1
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
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-vulnerability-metrics"
      sampled_requests_enabled   = true
    }
  }

  rule {
    # Blocks requests associated with Linux exploitation
    name     = "AWSLinuxManagement"
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "linux-vulnerability-metrics"
      sampled_requests_enabled   = true
    }
  }

  rule {
    # Blocks requests associated with POSIX and POSIX-like OS exploitation
    name     = "AWSUnixManagement"
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "unix-vulnerability-metrics"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "waf-general-metrics"
    sampled_requests_enabled   = true
  }
  # the following are custom rules and arent managed by AWS.
  rule {
    # Applies a rate based rule to IPs originating in the US
    name     = "AWSRateBasedRuleDomesticDOS"
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
    # Applies a rate based rule to IPs originating outside of the US
    name     = "AWSRateBasedRuleGlobalDOS"
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
# 1. WAF to generate logs [x]
# 2. Kinesis Firehose to recieve logs [x]
# firehose must be created with a PUT in us-west-2
# 3. S3 to store the logs. [x]

# logging configuration resource
resource "aws_wafv2_web_acl_logging_configuration" "waf_logging" {
  log_destination_configs = [aws_s3_bucket.waf_logging.arn, aws_kinesis_firehose_delivery_stream.waf_logging.arn] # bucket and firehose arns go here
  resource_arn            = aws_wafv2_web_acl.waf.arn
}
# firehose to recieve logs
resource "aws_kinesis_firehose_delivery_stream" "waf_logging" {
  name        = "waf-logging-metrics-stream"
  destination = "extended_s3"
  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = aws_kms_key.waf_logging.arn
  }
  extended_s3_configuration {
    # role arn actually is required :(
    role_arn   = "" # not sure what needs to go here
    bucket_arn = aws_s3_bucket.waf_logging.arn
    # probably don't need to enable data processors
  }
}
# IAM Role for Kinesis
resource "aws_iam_role" "firehose_perms" {
  name               = "placeholder"
  description        = "IAM role for the KDF"
  assume_role_policy = "" #TBA
  # what perms are needed
  # s3:Put
  # kinesis:*
}
# role policy
data "aws_iam_policy_document" "firehose_perms" {

}
# KMS key config
resource "aws_kms_key" "waf_logging" {
  enable_key_rotation = true
  description         = "KMS key for encrypting WAF logs"
}
# S3 to store logging resources
resource "aws_s3_bucket" "waf_logging" {
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement
  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  bucket = "waf_logs"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "waf_logging" {
  bucket = aws_s3_bucket.waf_logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "waf_logging" {
  bucket = aws_s3_bucket.waf_logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "waf_logging" {
  bucket = aws_s3_bucket.waf_logging.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.waf_logging.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "waf_logging" {
  bucket                = aws_s3_bucket.waf_logging.id
  expected_bucket_owner = data.aws_caller_identity.current.account_id # this threw an error based on where it was called

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

resource "aws_s3_bucket_logging" "waf_logging" {
  bucket        = aws_s3_bucket.waf_logging.id
  target_bucket = aws_s3_bucket.waf_logging.id
  target_prefix = "logs/waf-logging/"
}
