output "bucket_id" {
  value = aws_s3_bucket.s3_encrypted_log.id
}

output "bucket_name" {
  value = aws_s3_bucket.s3_encrypted_log.name
}