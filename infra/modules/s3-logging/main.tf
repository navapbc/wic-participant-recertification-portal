############################################################################################
## A module for creating an encrypted S3 bucket for logging purposes
## - With associated S3 bucket policies and access management
## - By default allows logging from Cloudwatch Logs, Elastic Load Balancing, and S3
############################################################################################

############################################################################################
## Encrypted S3 bucket logging
############################################################################################

# Create the S3 bucket to provide server access logging.
resource "aws_s3_bucket" "s3_encrypted_log" {
  bucket = var.logging_bucket_name

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_61:Lifecycle policy will be added in later ticket for post-pilot cleanup
  # checkov:skip=CKV2_AWS_62:Disable SNS requirement
  # checkov:skip=CKV_AWS_145:Access logging for s3 and elb does not support KMS SSE encryption
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
      # S3 and ELB access logging only supports AWS managed server-side encryption
      # using AES256. See:
      # - https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-server-access-logging.html
      # - https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/enable-access-logs.html
      sse_algorithm = "AES256"
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

  # Allow Cloudwatch Logs to log to the bucket.
  statement {
    sid = "CloudwatchAccess"

    principals {
      type = "Service"
      identifiers = [
        "logging.s3.amazonaws.com",
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

  # Allow Elastic Load Balancing to log to the bucket.
  statement {
    sid = "ElasticLoadBalancingAccess"

    principals {
      type = "AWS"
      identifiers = [
        # AWS requires that the region is hard coded.
        # See https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/enable-access-logs.html#attach-bucket-policy
        "arn:aws:iam::797873946194:root"
      ]
    }

    actions = [
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.s3_encrypted_log.arn}/*",
    ]

    effect = "Allow"
  }
}
