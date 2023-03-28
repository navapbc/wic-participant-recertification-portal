output "name" {
  value = var.name
}

output "file_system" {
  value = aws_efs_file_system.fs
}

output "access_point" {
  value = aws_efs_access_point.fs
}


# output "file_system_id" {
#   value = aws_efs_file_system.fs.id
# }

# output "file_system_arn" {
#   value = aws_efs_file_system.fs.arn
# }

# output "access_point_id" {
#   value = aws_efs_access_point.fs.id
# }

# output "access_point_arn" {
#   value = aws_efs_access_point.fs.arn
# }
