output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "client_id_secret_name" {
  value = local.client_id_secret_name
}

output "client_secret_secret_name" {
  value = local.client_secret_secret_name
}

output "idp_endpoint" {
  value = aws_cognito_user_pool.pool.endpoint
}
