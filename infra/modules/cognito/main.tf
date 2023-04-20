# A module for configuring an AWS Cognito User Pool
# Configures for email, but not SMS

resource "aws_cognito_user_pool" "pool" {
  name = var.pool_name

  # Deletion protection is available with aws provider version >= 4.38.0
  # deletion_protection = "ACTIVE"

  username_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = var.password_minimum_length
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  auto_verified_attributes = ["email"]
  # user_attribute_update_settings {
  #   attributes_require_verification_before_update = "email"
  # }

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

  email_configuration {
    email_sending_account  = var.email_sending_account
    from_email_address     = length(var.from_email_address) > 0 ? var.from_email_address : null
    reply_to_email_address = length(var.reply_to_email_address) > 0 ? var.reply_to_email_address : null
    source_arn             = var.email_sending_account == "DEVELOPER" ? var.email_source_arn : null
  }

  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_message = length(var.invite_email_message) > 0 ? var.invite_email_message : null
      email_subject = length(var.invite_email_subject) > 0 ? var.invite_email_subject : null
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = length(var.verification_email_message) > 0 ? var.verification_email_message : null
    email_subject        = length(var.verification_email_subject) > 0 ? var.verification_email_subject : null
  }
}