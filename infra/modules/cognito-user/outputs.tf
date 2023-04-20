output "user_ids" {
  value = [for user in aws_cognito_user.user : user.sub]
}