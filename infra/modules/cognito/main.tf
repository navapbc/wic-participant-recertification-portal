############################################################################################
## A module for configuring a Cognito User Pool
## - Configures for email, but not SMS
## - Does not configure MFA
## - Also creates a Cognito User Pool App Client
## - Protects the user pool with a WAF
## Note: This module assumes that the SSL certificate has been created in the AWS Console
############################################################################################

locals {
  client_id_secret_name     = "/metadata/idp/${var.pool_name}-client-id"
  client_secret_secret_name = "/metadata/idp/${var.pool_name}-client-secret"
}

############################################################################################
## User pool
############################################################################################

resource "aws_cognito_user_pool" "pool" {
  name                     = var.pool_name
  deletion_protection      = "ACTIVE"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = var.password_minimum_length
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = "true"
    required            = "true"

    string_attribute_constraints {
      max_length = 2048
      min_length = 0
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Optionally configures the FROM address and the REPLY-TO address
  # Optionally configures using the Cognito default email or using SES
  email_configuration {
    email_sending_account  = var.email_sending_account
    from_email_address     = length(var.from_email_address) > 0 ? var.from_email_address : null
    reply_to_email_address = length(var.reply_to_email_address) > 0 ? var.reply_to_email_address : null
    source_arn             = var.email_sending_account == "DEVELOPER" ? var.email_source_arn : null
  }

  admin_create_user_config {
    allow_admin_create_user_only = true

    # Optionally configures email template for activating the account
    invite_message_template {
      email_message = length(var.invite_email_message) > 0 ? var.invite_email_message : null
      email_subject = length(var.invite_email_subject) > 0 ? var.invite_email_subject : null
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  # Optionally configures email template for resetting a password
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = length(var.verification_email_message) > 0 ? var.verification_email_message : null
    email_subject        = length(var.verification_email_subject) > 0 ? var.verification_email_subject : null
  }
}

############################################################################################
## User pool app client
##
## Important! You must create an SSL certificate for a custom domain for the Cognito User
## Pool App Client must be in us-east-1! Do not change this regardless of which region your
## other resources or certificates are deployed in.
## See https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html#cognito-user-pools-add-custom-domain-adding
############################################################################################

provider "aws" {
  region = "us-east-1"
  alias  = "us-east-1"
}

data "aws_acm_certificate" "cert" {
  domain   = var.hosted_zone_domain
  provider = aws.us-east-1
}

resource "aws_cognito_user_pool_domain" "client" {
  domain          = var.client_domain
  certificate_arn = data.aws_acm_certificate.cert.arn
  user_pool_id    = aws_cognito_user_pool.pool.id
}

data "aws_route53_zone" "client" {
  name = var.hosted_zone_domain
}

resource "aws_route53_record" "client" {
  name    = aws_cognito_user_pool_domain.client.domain
  type    = "A"
  zone_id = data.aws_route53_zone.client.id
  alias {
    name = aws_cognito_user_pool_domain.client.cloudfront_distribution_arn
    # The following zone id is CloudFront.
    # See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-aliastarget.html
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = var.pool_name
  user_pool_id = aws_cognito_user_pool.pool.id

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = var.client_allowed_oauth_flows
  allowed_oauth_scopes                 = var.client_allowed_oauth_scopes
  explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH"]

  generate_secret = var.client_generate_secret
  callback_urls   = var.client_callback_urls
  logout_urls     = var.client_logout_urls

  enable_token_revocation                       = true
  enable_propagate_additional_user_context_data = false
  prevent_user_existence_errors                 = "ENABLED"
  supported_identity_providers                  = ["COGNITO"]
  read_attributes = [
    "email",
    "email_verified",
    "updated_at"
  ]
  write_attributes = [
    "email",
    "updated_at"
  ]
}

resource "aws_ssm_parameter" "client_id" {
  name   = local.client_id_secret_name
  type   = "SecureString"
  value  = aws_cognito_user_pool_client.client.id
  key_id = aws_kms_key.client_secrets.key_id
}

resource "aws_ssm_parameter" "client_secret" {
  name   = local.client_secret_secret_name
  type   = "SecureString"
  value  = aws_cognito_user_pool_client.client.client_secret
  key_id = aws_kms_key.client_secrets.key_id
}

resource "aws_kms_key" "client_secrets" {
  enable_key_rotation = true
  description         = "KMS key for client secrets"
}
############################################################################################
## WAF association
############################################################################################

data "aws_wafv2_web_acl" "waf" {
  name  = var.waf_name
  scope = "REGIONAL"
}
resource "aws_wafv2_web_acl_association" "cognito" {
  resource_arn = aws_cognito_user_pool.pool.arn
  web_acl_arn  = data.aws_wafv2_web_acl.waf.arn
}
