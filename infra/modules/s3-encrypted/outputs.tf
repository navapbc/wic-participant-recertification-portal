output "encrypted_bucket" {
  value = aws_s3_bucket.s3_encrypted
}

output "encrypted_bucket_kms" {
  value = aws_kms_key.s3_encrypted
}