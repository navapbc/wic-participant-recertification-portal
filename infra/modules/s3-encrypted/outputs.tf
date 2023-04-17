output "encrypted_bucket_id" {
  value = aws_s3_bucket.s3_encrypted.id
}

output "encrypted_bucket_arn" {
  value = aws_s3_bucket.s3_encrypted.arn
}

output "bucket_kms_arn" {
  value = aws_kms_key.s3_encrypted.arn
}