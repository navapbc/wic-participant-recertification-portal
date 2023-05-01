data "aws_cognito_user_pools" "pool" {
  name = var.user_pool_name
}

resource "aws_cognito_user" "user" {
  for_each     = var.user_emails
  username     = each.key
  user_pool_id = tolist(data.aws_cognito_user_pools.pool.ids)[0]

  desired_delivery_mediums = ["EMAIL"]
  enabled                  = true

  attributes = {
    email          = each.key
    email_verified = true
  }
}
