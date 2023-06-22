output "resource_name" {
  value = var.resource_name
}

output "file_system_id" {
  value = aws_efs_file_system.fs.id
}

output "file_system_arn" {
  value = aws_efs_file_system.fs.arn
}

output "access_point_id" {
  value = aws_efs_access_point.fs.id
}

output "access_point_arn" {
  value = aws_efs_access_point.fs.arn
}
