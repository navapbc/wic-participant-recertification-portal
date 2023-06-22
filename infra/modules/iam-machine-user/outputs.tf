output "machine_user_group_name" {
  value = aws_iam_group.machine_user.name
}

output "access_key_id_secret_arn" {
  value = aws_ssm_parameter.access_key_id.arn
}

output "secret_access_key_secret_arn" {
  value = aws_ssm_parameter.secret_access_key.arn
}