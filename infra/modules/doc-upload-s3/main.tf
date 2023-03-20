data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_s3_bucket" "doc-upload" {
  bucket = "${var.environment_name}-document-upload"

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_61:This S3 bucket should not transition objects to another storage class or expire objects
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement

}

resource "aws_s3_bucket_public_access_block" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.id
  policy = data.aws_iam_policy_document.doc-upload.json
}


resource "aws_s3_bucket_versioning" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "doc-upload" {
  bucket = aws_s3_bucket.doc-upload.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.doc-upload.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_kms_key" "doc-upload" {
  description = "KMS key for ${var.environment_name} Document Upload"
  # The waiting period, specified in number of days. After the waiting period ends, AWS KMS deletes the KMS key.
  deletion_window_in_days = "10"
  # Generates new cryptographic material every 365 days, this is used to encrypt your data. The KMS key retains the old material for decryption purposes.
  enable_key_rotation = "true"
}

# Create the S3 bucket to provide server access logging.
resource "aws_s3_bucket" "doc-upload-log" {
  bucket = "${var.environment_name}-upload-logging"

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement
}
resource "aws_s3_bucket_logging" "doc-upload" {
  bucket        = aws_s3_bucket.doc-upload.id
  target_bucket = aws_s3_bucket.doc-upload-log.bucket
  target_prefix = var.environment_name
}
data "aws_iam_role" "task_executor" {
  # Referencing the task executor of the ECS services so that they have the ability to upload documents to s3
  name = "${var.service_name}-task-executor"

}

data "aws_iam_policy_document" "doc-upload" {
  statement {
    sid = "BucketAccess"

    effect = "Allow"


    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:ListBucketMultipartUploads",
      "s3:ListMultipartUploadParts",
      "s3:DeleteObject"
    ]

    resources = [
      "${aws_s3_bucket.doc-upload.arn}",
      "${aws_s3_bucket.doc-upload.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["${data.aws_iam_role.task_executor.arn}"]
    }
  }
}
