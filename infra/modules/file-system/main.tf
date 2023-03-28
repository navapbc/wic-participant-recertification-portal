resource "aws_efs_file_system" "fs" {
  encrypted = true
}

resource "aws_efs_access_point" "fs" {
  file_system_id = aws_efs_file_system.fs.id
}

resource "aws_efs_mount_target" "fs" {
  for_each        = toset(var.subnet_ids)
  file_system_id  = aws_efs_file_system.fs.id
  subnet_id       = each.value
  security_groups = var.security_groups
}

resource "aws_efs_backup_policy" "fs" {
  file_system_id = aws_efs_file_system.fs.id
  backup_policy {
    status = "ENABLED"
  }
}
