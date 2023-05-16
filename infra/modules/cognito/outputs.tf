output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "client_id_secret_arn" {
  value = aws_ssm_parameter.client_id.arn
}

output "client_secret_secret_arn" {
  value = aws_ssm_parameter.client_secret.arn
}
