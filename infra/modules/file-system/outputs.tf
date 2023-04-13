output "resource_name" {
  value = var.resource_name
}

output "file_system" {
  value = aws_efs_file_system.fs
}

output "access_point" {
  value = aws_efs_access_point.fs
}
