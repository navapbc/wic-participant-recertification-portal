output "staff_user_list" {
  value = [for user in aws_cognito_user.user : {
    "staffUserId" : user.sub,
    "localAgencyUrlId" : var.user_emails[user.username]
    }
  ]
}