data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_s3_bucket" "s3_encrypted" {
  bucket = var.s3_bucket_name

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_61:Lifecycle policy will be added in later ticket for post-pilot cleanup
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement

}

resource "aws_s3_bucket_public_access_block" "s3_encrypted" {
  bucket = aws_s3_bucket.s3_encrypted.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "s3_encrypted" {
  bucket = aws_s3_bucket.s3_encrypted.id
  policy = data.aws_iam_policy_document.s3_encrypted.json
}

resource "aws_iam_policy" "read" {
  name        = "${var.s3_bucket_name}-read"
  description = "Allows read access to the bucket"
  policy      = data.aws_iam_policy_document.read_s3.json
}

resource "aws_iam_policy" "write" {
  name        = "${var.s3_bucket_name}-write"
  description = "Allows write access to the bucket"
  policy      = data.aws_iam_policy_document.write_s3.json
}

resource "aws_iam_policy" "delete" {
  name        = "${var.s3_bucket_name}-delete"
  description = "Allows delete access to the bucket"
  policy      = data.aws_iam_policy_document.delete_s3.json
}

resource "aws_iam_role_policy_attachment" "read" {
  for_each   = toset(var.read_role_names)
  role       = each.value
  policy_arn = aws_iam_policy.read.arn
}

resource "aws_iam_role_policy_attachment" "write" {
  for_each   = toset(var.write_role_names)
  role       = each.value
  policy_arn = aws_iam_policy.write.arn
}
resource "aws_iam_role_policy_attachment" "delete" {
  for_each   = toset(var.delete_role_names)
  role       = each.value
  policy_arn = aws_iam_policy.delete.arn
}

resource "aws_s3_bucket_versioning" "s3_encrypted" {
  bucket = aws_s3_bucket.s3_encrypted.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encrypted" {
  bucket = aws_s3_bucket.s3_encrypted.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encrypted.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_kms_key" "s3_encrypted" {
  description = "KMS key for ${var.environment_name} Document Upload"
  # The waiting period, specified in number of days. After receiving a deletion request, AWS KMS will delete the KMS key after the waiting period ends. During the waiting period, the KMS key status and key state is Pending deletion. See https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html#deleting-keys-how-it-works
  deletion_window_in_days = "10"
  # Generates new cryptographic material every 365 days, this is used to encrypt your data. The KMS key retains the old material for decryption purposes.
  enable_key_rotation = "true"
}

# ----------------------------------------------------
#
#  Document Upload Logging
#
# ----------------------------------------------------

# Create the S3 bucket to provide server access logging.
resource "aws_s3_bucket" "s3_encrypted_log" {
  bucket = "${var.s3_bucket_name}-logging"

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_61:Lifecycle policy will be added in later ticket for post-pilot cleanup
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement
}
resource "aws_s3_bucket_logging" "s3_encrypted_log" {
  bucket = aws_s3_bucket.s3_encrypted.id
  # Checkov recommends using an s3 bucket to store logging for other s3 buckets. The bucket created on #L61 is the target bucket
  target_bucket = aws_s3_bucket.s3_encrypted_log.bucket
  target_prefix = var.environment_name
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
      kms_master_key_id = aws_kms_key.s3_encrypted.arn
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

# ----------------------------------------------------
#
#  Data Attributes
#
# ----------------------------------------------------

data "aws_iam_policy_document" "delete_s3" {
  statement {
    sid    = "AllowDelete"
    effect = "Allow"
    actions = [
      "s3:AbortMultipartUpload",
      "s3:DeleteObject",
      "kms:Decrypt",
    "kms:GenerateDataKey"]
    resources = [
      aws_kms_key.s3_encrypted.arn,
      aws_s3_bucket.s3_encrypted.arn,
    "${aws_s3_bucket.s3_encrypted.arn}/*"]
  }
}

data "aws_iam_policy_document" "read_s3" {
  statement {
    sid    = "AllowReadAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:ListMultipartUploadParts",
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]

    resources = [
      aws_kms_key.s3_encrypted.arn,
      aws_s3_bucket.s3_encrypted.arn,
      "${aws_s3_bucket.s3_encrypted.arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "write_s3" {
  statement {
    sid    = "AllowWriteAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "kms:GenerateDataKey",
      "kms:Decrypt",
    ]

    resources = [
      aws_kms_key.s3_encrypted.arn,
      aws_s3_bucket.s3_encrypted.arn,
      "${aws_s3_bucket.s3_encrypted.arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "s3_encrypted" {
  statement {
    sid    = "DenyUnEncryptedObjectUploads"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = ["s3:PutObject", ]
    resources = [
      "${aws_s3_bucket.s3_encrypted.arn}/*"
    ]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
      values   = ["${aws_kms_key.s3_encrypted.arn}"]
    }
  }

  statement {
    sid = "RequireTLS"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = [
      "s3:*"
    ]
    resources = [
      aws_s3_bucket.s3_encrypted.arn,
      "${aws_s3_bucket.s3_encrypted.arn}/*",
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
}

data "aws_iam_policy_document" "s3_encrypted_log" {

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
}
