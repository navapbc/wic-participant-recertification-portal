output "user_pool_name" {
  value = var.user_pool_name
}

output "user_pool_id" {
  value = data.aws_cognito_user_pools.pool.ids[0]
}

output "staff_user_list" {
  value = [for user in aws_cognito_user.user : {
    "staffUserId" : user.sub,
    "localAgencyUrlId" : var.user_emails[user.username]
    }
  ]
}