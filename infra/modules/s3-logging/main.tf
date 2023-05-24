############################################################################################
## A module for creating an encrypted S3 bucket for logging purposes
## - With associated S3 bucket policies and access management
## - Also creates an encrypted S3 bucket for logging operations
## - Creates IAM policies:
##   - IAM policies in this module are broken out into read, write, and delete
##     so that these permissions can be modularly assigned to different user groups by the
##     module calling this one.
############################################################################################

############################################################################################
## KMS key
############################################################################################

resource "aws_kms_key" "s3_encrypted_log" {
  description = "KMS key for encrypted S3 bucket"

  # The waiting period, specified in number of days. After receiving a deletion request,
  # AWS KMS will delete the KMS key after the waiting period ends. During the waiting period,
  # the KMS key status and key state is Pending deletion.
  # See https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html#deleting-keys-how-it-works
  deletion_window_in_days = "10"

  # Generates new cryptographic material every 365 days, this is used to encrypt your data.
  # The KMS key retains the old material for decryption purposes.
  enable_key_rotation = "true"
}

############################################################################################
## Encrypted S3 bucket logging
############################################################################################

# Create the S3 bucket to provide server access logging.
resource "aws_s3_bucket" "s3_encrypted_log" {
  bucket = var.logging_bucket_name

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_61:Lifecycle policy will be added in later ticket for post-pilot cleanup
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement
}

resource "aws_s3_bucket_versioning" "s3_encrypted_log" {
  bucket = aws_s3_bucket.s3_encrypted_log.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encrypted_log" {
  bucket = aws_s3_bucket.s3_encrypted_log.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encrypted_log.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "s3_encrypted_log" {
  bucket = aws_s3_bucket.s3_encrypted_log.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "s3_encrypted_log" {
  bucket = aws_s3_bucket.s3_encrypted_log.id
  policy = data.aws_iam_policy_document.s3_encrypted_log.json
}

data "aws_iam_policy_document" "s3_encrypted_log" {
  statement {
    sid = "RequireTLS"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = [
      "s3:*",
    ]

    resources = [
      aws_s3_bucket.s3_encrypted_log.arn,
      "${aws_s3_bucket.s3_encrypted_log.arn}/*"
    ]

    effect = "Deny"

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"

      values = [
        false
      ]
    }
  }

  # Allow logging.s3.amazonaws.com put objects into the s3_encrypted_log bucket.
  statement {
    sid = "S3ServerAccessLogsPolicy"
    principals {
      type = "Service"
      identifiers = [
        "logging.s3.amazonaws.com"
      ]
    }
    actions = [
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.s3_encrypted_log.arn}/*"
    ]

    effect = "Allow"
  }
}
