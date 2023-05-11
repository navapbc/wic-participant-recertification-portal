output "task_role_name" {
  value = aws_iam_role.task.name
}

output "app_security_group" {
  value = aws_security_group.app
}
