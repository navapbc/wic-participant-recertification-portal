output "admin_user" {
  value = local.admin_user
}

output "admin_user_secret_arn" {
  value = aws_ssm_parameter.admin_user.arn
}

output "admin_password_secret_arn" {
  value = aws_ssm_parameter.admin_password.arn
}

output "admin_db_url_secret_arn" {
  value = aws_ssm_parameter.admin_db_url.arn
}

output "admin_db_host_secret_arn" {
  value = aws_ssm_parameter.admin_db_host.arn
}
