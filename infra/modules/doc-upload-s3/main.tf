# Commenting this out until we need to create the document upload bucket
# data "aws_caller_identity" "current" {}
# data "aws_region" "current" {}

# resource "aws_s3_bucket" "doc-upload" {
#   bucket = "${var.environment_name}-document-upload"
# }

# resource "aws_s3_account_public_access_block" "doc-upload" {
#   bucket = aws_s3_bucket.doc-upload.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# resource "aws_s3_bucket_policy" "doc-upload" {
#   bucket = aws_s3_bucket.doc-upload.id
#   policy = "" # TBA
# }

# data "aws_iam_policy_document" "doc-upload" {
#   statement {
#     sid = "BucketAccess"

#     effect = "Allow"


#     actions = [
#       "s3:ListBucket",
#       "s3:GetBucketLocation",
#       "s3:GetObject"
#     ]

#     resources = [

#     ]
#   }
# }